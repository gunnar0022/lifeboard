"""
Investing agent — nudge checks.
Returns list of {"text": str, "severity": str, "agent": str} dicts.
"""
import logging
from backend.agents.investing import queries
from backend.config import get_currency_symbol

logger = logging.getLogger(__name__)


async def check_nudges() -> list[dict]:
    nudges = []
    try:
        holdings = await queries.get_holdings()
        if not holdings:
            return nudges

        portfolio = await queries.get_portfolio_summary()

        # 1. Stale price data (> 2 days)
        stale = await queries.get_stale_holdings(days=2)
        if stale:
            symbols = ", ".join(h["symbol"] for h in stale[:3])
            suffix = f" and {len(stale)-3} more" if len(stale) > 3 else ""
            nudges.append({
                "text": f"Price data is stale for {symbols}{suffix}",
                "severity": "warning",
                "agent": "investing",
            })

        # 2. Concentration risk (any single holding > 40% of total)
        total_value = portfolio.get("total_value", 0)
        if total_value > 0:
            for h in holdings:
                pct = (h["market_value"] / total_value) * 100
                if pct > 40:
                    nudges.append({
                        "text": f"Portfolio concentrated: {h['symbol']} is {pct:.0f}% of total",
                        "severity": "warning",
                        "agent": "investing",
                    })
                    break  # Only one concentration nudge

        # 3. Large unrealized gains (> 10%)
        total_cost = portfolio.get("total_cost", 0)
        if total_cost > 0:
            gain_pct = portfolio.get("gain_loss_pct", 0)
            if gain_pct > 10:
                symbol = get_currency_symbol()
                gain = portfolio["gain_loss"]
                nudges.append({
                    "text": f"Unrealized gains: {symbol}{gain:,} (+{gain_pct:.1f}%)",
                    "severity": "info",
                    "agent": "investing",
                })
    except Exception as e:
        logger.error(f"Investing nudge check error: {e}")

    return nudges
