"""
Finance agent -- cycle compression scheduler.
Runs on the 24th of each month (LM-24: 3-day grace period after cycle boundary).
Pipeline: aggregate -> generate insights -> store summary -> delete detail (LM-26).
"""
import os
import asyncio
import json
import logging
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from backend.config import get_config
from backend.agents.finance import queries

logger = logging.getLogger(__name__)

_compression_task: asyncio.Task | None = None


async def start_scheduler():
    """Start the finance compression scheduler."""
    global _compression_task
    _compression_task = asyncio.create_task(_monthly_compression_loop())
    logger.info("Finance compression scheduler started")


async def stop_scheduler():
    """Cancel the compression task."""
    global _compression_task
    if _compression_task and not _compression_task.done():
        _compression_task.cancel()
        try:
            await _compression_task
        except asyncio.CancelledError:
            pass
    _compression_task = None
    logger.info("Finance compression scheduler stopped")


async def _monthly_compression_loop():
    """
    Run cycle compression on the 24th of each month at 3 AM.
    Compresses the cycle that is now 2 cycles old (outside the current + previous window).
    """
    while True:
        try:
            config = get_config()
            tz = ZoneInfo(config.get("timezone", "UTC"))
            now = datetime.now(tz)

            # Find next 24th at 3 AM
            if now.day < 24:
                target = now.replace(day=24, hour=3, minute=0, second=0, microsecond=0)
            elif now.day == 24 and now.hour < 3:
                target = now.replace(hour=3, minute=0, second=0, microsecond=0)
            else:
                # Move to 24th of next month
                if now.month == 12:
                    target = now.replace(year=now.year + 1, month=1, day=24,
                                         hour=3, minute=0, second=0, microsecond=0)
                else:
                    target = now.replace(month=now.month + 1, day=24,
                                         hour=3, minute=0, second=0, microsecond=0)

            wait_seconds = (target - now).total_seconds()
            logger.info(f"Next finance cycle compression in {wait_seconds / 3600:.1f} hours (target: {target.date()})")
            await asyncio.sleep(wait_seconds)

            await run_compression()

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Finance compression loop error: {e}")
            await asyncio.sleep(3600)


async def run_compression():
    """
    Run the cycle compression pipeline.
    Identifies the cycle that is 2 cycles old and compresses it.
    Idempotent: safe to call multiple times (LM-24).
    """
    config = get_config()
    pay_day = config.get("pay_cycle_day", 1)

    # The cycle to compress is offset=-2 (two cycles ago)
    # Current cycle = offset 0, previous = offset -1 (kept), two ago = offset -2 (compress)
    cycle_start, cycle_end = queries._get_cycle_dates(offset=-2)
    cs = cycle_start.isoformat()
    ce = cycle_end.isoformat()

    # Check if already compressed (idempotent)
    existing = await queries.get_cycle_summary_record(cs, ce)
    if existing:
        logger.info(f"Cycle {cs} to {ce} already compressed, skipping")
        return

    # Check if there are any transactions to compress
    aggregated = await queries.aggregate_cycle_for_compression(cs, ce)
    if aggregated["transaction_count"] == 0 and aggregated["transfer_volume"] == 0:
        logger.info(f"Cycle {cs} to {ce} has no data to compress, skipping")
        return

    logger.info(f"Compressing cycle {cs} to {ce} ({aggregated['transaction_count']} transactions)")

    # Step 1: Generate insights with Claude BEFORE deletion (LM-26)
    insights = await _generate_insights(aggregated)

    # Step 2: Store the summary
    await queries.store_cycle_summary(
        cycle_start=cs,
        cycle_end=ce,
        total_income=aggregated["total_income"],
        total_expenses=aggregated["total_expenses"],
        net=aggregated["net"],
        transfer_volume=aggregated["transfer_volume"],
        transaction_count=aggregated["transaction_count"],
        category_breakdown=aggregated["category_breakdown"],
        budget_snapshot=aggregated["budget_snapshot"],
        insights=insights,
    )
    logger.info(f"Stored cycle summary for {cs} to {ce}")

    # Step 3: Delete individual records (ONLY after summary is stored)
    await queries.delete_cycle_transactions(cs, ce)
    logger.info(f"Deleted compressed transactions for {cs} to {ce}")


async def _generate_insights(aggregated: dict) -> list[str]:
    """
    Generate 2-3 natural language insights about a completed cycle using Claude.
    Falls back to empty list if API fails.
    """
    try:
        from anthropic import AsyncAnthropic

        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key:
            logger.warning("No ANTHROPIC_API_KEY, skipping insight generation")
            return []

        client = AsyncAnthropic(api_key=api_key)
        config = get_config()
        currency = config.get("primary_currency", "JPY")
        symbol = {"JPY": "\\u00a5", "USD": "$"}.get(currency, "$")

        # Build historical averages for comparison
        averages = await queries.get_historical_category_averages()

        # Format transaction list for Claude
        tx_lines = []
        for tx in aggregated["transactions"][:100]:  # Cap at 100 for prompt size
            amt = tx["amount"]
            sign = "+" if amt > 0 else ""
            tx_lines.append(f"  {tx['date']} | {sign}{amt} | {tx['category']} | {tx.get('description', '')}")

        prompt = f"""Here is the complete spending data for pay cycle {aggregated['cycle_start']} to {aggregated['cycle_end']}.

Summary:
- Total income: {symbol}{aggregated['total_income']:,}
- Total expenses: {symbol}{aggregated['total_expenses']:,}
- Net: {symbol}{aggregated['net']:,}
- Transfers: {symbol}{aggregated['transfer_volume']:,}
- Transaction count: {aggregated['transaction_count']}

Spending by category:
{json.dumps(aggregated['category_breakdown'], indent=2)}

Budget limits during this cycle:
{json.dumps(aggregated['budget_snapshot'], indent=2)}

Historical average spending per category:
{json.dumps(averages, indent=2) if averages else "No historical data yet (first cycle)."}

Individual transactions:
{chr(10).join(tx_lines) if tx_lines else "No transactions."}

Generate 2-3 brief, specific insights about this cycle. Focus on:
- Anomalies or notable patterns compared to averages
- Categories that were significantly over or under budget
- Notable spending events or patterns

Be concrete -- reference specific categories and numbers. Use {symbol} for currency.
Keep each insight to 1-2 sentences. Return as a JSON array of strings."""

        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()
        # Extract JSON array from response
        if "[" in text:
            start = text.index("[")
            end = text.rindex("]") + 1
            insights = json.loads(text[start:end])
            if isinstance(insights, list) and all(isinstance(i, str) for i in insights):
                return insights[:3]

        return []
    except Exception as e:
        logger.error(f"Insight generation failed: {e}")
        return []
