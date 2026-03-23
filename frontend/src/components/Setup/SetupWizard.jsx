import { useState, useEffect } from 'react';
import {
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Check, X, Loader, ExternalLink,
  Heart, DollarSign, TrendingUp, BookOpen, Stethoscope, FileText,
  Calendar,
} from 'lucide-react';
import './SetupWizard.css';

const STEPS = [
  'welcome', 'identity', 'anthropic', 'telegram', 'google',
  'health', 'finance', 'investing', 'reading', 'agents', 'restart', 'done',
];

function StepIndicator({ current, total }) {
  return (
    <div className="wizard__progress">
      <div className="wizard__progress-bar" style={{ width: `${(current / (total - 1)) * 100}%` }} />
    </div>
  );
}

function CollapsibleInstructions({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="wizard__instructions">
      <button className="wizard__instructions-toggle" onClick={() => setOpen(!open)}>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span>{title}</span>
      </button>
      {open && <div className="wizard__instructions-body">{children}</div>}
    </div>
  );
}

export default function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    user_name: '',
    display_name: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    timezone_confirmed: false,
    anthropic_key: '',
    anthropic_valid: null,
    anthropic_testing: false,
    telegram_token: '',
    telegram_chat_id: '',
    telegram_valid: null,
    telegram_testing: false,
    telegram_bot_name: '',
    google_client_id: '',
    google_client_secret: '',
    google_skip: false,
    health_height: '',
    health_weight: '',
    health_age: '',
    health_activity: 'moderate',
    health_calorie_goal: '',
    pay_cycle_day: '25',
    salary_is_net: true,
    salary_amount: '',
    invest_symbol: '',
    invest_shares: '',
    invest_price: '',
    reading_title: '',
    reading_author: '',
  });

  const update = (fields) => setData(prev => ({ ...prev, ...fields }));
  const currentStep = STEPS[step];
  const canNext = () => {
    switch (currentStep) {
      case 'identity': return data.user_name.trim() && data.display_name.trim();
      case 'anthropic': return data.anthropic_valid === true;
      case 'telegram': return data.telegram_valid === true && data.telegram_chat_id.trim();
      default: return true;
    }
  };

  const handleNext = async () => {
    // Save data at key transitions
    if (currentStep === 'identity') {
      await fetch('/api/setup/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: data.user_name.trim(),
          display_name: data.display_name.trim(),
          timezone: data.timezone,
          primary_currency: 'JPY',
          secondary_currency: 'USD',
          active_agents: ['life_manager', 'health_body', 'finance', 'investing', 'reading_creative'],
          locale: 'en',
        }),
      });
    }
    if (currentStep === 'anthropic') {
      await fetch('/api/setup/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ANTHROPIC_API_KEY: data.anthropic_key }),
      });
    }
    if (currentStep === 'telegram') {
      await fetch('/api/setup/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          TELEGRAM_BOT_TOKEN: data.telegram_token,
          TELEGRAM_CHAT_ID: data.telegram_chat_id,
        }),
      });
    }
    if (currentStep === 'google' && !data.google_skip && data.google_client_id && data.google_client_secret) {
      await fetch('/api/setup/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          GOOGLE_CLIENT_ID: data.google_client_id,
          GOOGLE_CLIENT_SECRET: data.google_client_secret,
        }),
      });
    }
    if (currentStep === 'health') {
      const profile = {};
      if (data.health_height) profile.height_cm = parseFloat(data.health_height);
      if (data.health_weight) profile.weight_g = Math.round(parseFloat(data.health_weight) * 1000);
      if (data.health_age) profile.age = parseInt(data.health_age);
      if (data.health_activity) profile.activity_level = data.health_activity;
      if (data.health_calorie_goal) profile.daily_calorie_goal = parseInt(data.health_calorie_goal);
      if (Object.keys(profile).length > 0) {
        try {
          const r = await fetch('/api/setup/health-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile),
          });
          if (!r.ok) console.error('Health profile save failed:', await r.text());
        } catch (e) { console.error('Health profile save error:', e); }
      }
    }
    if (currentStep === 'finance') {
      const financeConfig = {
        pay_cycle_day: parseInt(data.pay_cycle_day) || 25,
        salary_is_net: true,
      };
      if (data.salary_amount) {
        financeConfig.monthly_salary = parseInt(data.salary_amount);
      }
      await fetch('/api/setup/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(financeConfig),
      });
    }
    if (currentStep === 'investing' && data.invest_symbol.trim()) {
      try {
        const r = await fetch('/api/setup/add-holding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: data.invest_symbol.trim().toUpperCase(),
            shares: data.invest_shares || '0',
            price: data.invest_price || '0',
          }),
        });
        if (!r.ok) console.error('Investing save failed:', await r.text());
      } catch (e) { console.error('Investing save error:', e); }
    }
    if (currentStep === 'reading' && data.reading_title.trim()) {
      try {
        const r = await fetch('/api/setup/add-book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.reading_title.trim(),
            author: data.reading_author.trim() || null,
            status: 'reading',
          }),
        });
        if (!r.ok) console.error('Book save failed:', await r.text());
      } catch (e) { console.error('Book save error:', e); }
    }
    if (currentStep === 'restart') {
      await fetch('/api/setup/complete', { method: 'POST' });
    }

    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const testAnthropic = async () => {
    update({ anthropic_testing: true, anthropic_valid: null });
    const res = await fetch('/api/setup/test-anthropic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: data.anthropic_key }),
    });
    const result = await res.json();
    update({ anthropic_testing: false, anthropic_valid: result.valid });
  };

  const testTelegram = async () => {
    update({ telegram_testing: true, telegram_valid: null });
    const res = await fetch('/api/setup/test-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: data.telegram_token }),
    });
    const result = await res.json();
    update({
      telegram_testing: false,
      telegram_valid: result.valid,
      telegram_bot_name: result.bot_username || '',
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="wizard__step wizard__step--welcome">
            <h1>Welcome to LifeBoard</h1>
            <p>Your personal life management system.</p>
            <p className="wizard__subtitle">Let's get you set up. This will take about 5 minutes.</p>
          </div>
        );

      case 'identity':
        return (
          <div className="wizard__step">
            <h2>Let's start with you</h2>
            <div className="wizard__field">
              <label>What's your name?</label>
              <input value={data.user_name} onChange={e => update({ user_name: e.target.value })} placeholder="Your full name" />
              <span className="wizard__hint">Dr. Fleet and formal contexts will use this.</span>
            </div>
            <div className="wizard__field">
              <label>What should I call you?</label>
              <input value={data.display_name} onChange={e => update({ display_name: e.target.value })} placeholder="A nickname or short name" />
              <span className="wizard__hint">Used in dashboard greetings and agent replies.</span>
            </div>
            <div className="wizard__field">
              <label>
                It looks like you're in <strong>{data.timezone}</strong> and it's currently{' '}
                <strong>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: data.timezone })}</strong>.
                {' '}Is that right?
              </label>
              <div className="wizard__row">
                <button className={`wizard__choice ${data.timezone_confirmed !== false ? 'wizard__choice--active' : ''}`} onClick={() => update({ timezone_confirmed: true })}>
                  Yes, that's correct
                </button>
                <button className={`wizard__choice ${data.timezone_confirmed === false ? 'wizard__choice--active' : ''}`} onClick={() => update({ timezone_confirmed: false })}>
                  No, that's not my time
                </button>
              </div>
              {data.timezone_confirmed === false && (
                <div className="wizard__field">
                  <label>Select your timezone:</label>
                  <select value={data.timezone} onChange={e => update({ timezone: e.target.value })}>
                    <option value="Pacific/Honolulu">Hawaii (HST)</option>
                    <option value="America/Anchorage">Alaska (AKST)</option>
                    <option value="America/Los_Angeles">Pacific (PST)</option>
                    <option value="America/Denver">Mountain (MST)</option>
                    <option value="America/Chicago">Central (CST)</option>
                    <option value="America/New_York">Eastern (EST)</option>
                    <option value="America/Sao_Paulo">Brazil (BRT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Central Europe (CET)</option>
                    <option value="Europe/Helsinki">Eastern Europe (EET)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="Asia/Bangkok">Bangkok (ICT)</option>
                    <option value="Asia/Shanghai">China (CST)</option>
                    <option value="Asia/Tokyo">Japan (JST)</option>
                    <option value="Asia/Seoul">Korea (KST)</option>
                    <option value="Australia/Sydney">Sydney (AEST)</option>
                    <option value="Pacific/Auckland">New Zealand (NZST)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        );

      case 'anthropic':
        return (
          <div className="wizard__step">
            <h2>Connect Claude</h2>
            <p>LifeBoard uses Claude to understand your messages. You'll need an Anthropic API key.</p>
            <CollapsibleInstructions title="How to get an Anthropic API key">
              <ol>
                <li>Go to <a href="https://console.anthropic.com" target="_blank" rel="noopener">console.anthropic.com</a></li>
                <li>Create an account or sign in</li>
                <li>Navigate to <strong>API Keys</strong> in the sidebar</li>
                <li>Click <strong>Create Key</strong></li>
                <li>Copy the key (starts with <code>sk-ant-</code>)</li>
                <li>Paste it below</li>
              </ol>
            </CollapsibleInstructions>
            <div className="wizard__field">
              <label>Paste your API key</label>
              <input type="password" value={data.anthropic_key} onChange={e => update({ anthropic_key: e.target.value, anthropic_valid: null })} placeholder="sk-ant-..." />
              <button className="wizard__test-btn" onClick={testAnthropic} disabled={!data.anthropic_key || data.anthropic_testing}>
                {data.anthropic_testing ? <><Loader size={14} className="wizard__spinner" /> Testing...</> : 'Test connection'}
              </button>
              {data.anthropic_valid === true && <div className="wizard__status wizard__status--ok"><Check size={14} /> API key is valid</div>}
              {data.anthropic_valid === false && <div className="wizard__status wizard__status--err"><X size={14} /> Invalid key — check for typos</div>}
              <span className="wizard__hint">Your key is stored locally in a .env file — it never leaves your machine.</span>
            </div>
          </div>
        );

      case 'telegram':
        return (
          <div className="wizard__step">
            <h2>Connect Telegram</h2>
            <p>LifeBoard uses Telegram as your primary input. You'll need to create a bot.</p>
            <CollapsibleInstructions title="How to create a Telegram bot">
              <ol>
                <li>If you don't have Telegram, <a href="https://telegram.org/apps" target="_blank" rel="noopener">install it here</a></li>
                <li>Open Telegram and search for <strong>@BotFather</strong></li>
                <li>Send <code>/newbot</code></li>
                <li>Choose a name for your bot (e.g., "My LifeBoard")</li>
                <li>Choose a username (must end in "bot", e.g., "mylifeboard_bot")</li>
                <li>BotFather will give you a token — copy it below</li>
              </ol>
            </CollapsibleInstructions>
            <div className="wizard__field">
              <label>Bot token</label>
              <input type="password" value={data.telegram_token} onChange={e => update({ telegram_token: e.target.value, telegram_valid: null })} placeholder="123456789:ABCdef..." />
              <button className="wizard__test-btn" onClick={testTelegram} disabled={!data.telegram_token || data.telegram_testing}>
                {data.telegram_testing ? <><Loader size={14} className="wizard__spinner" /> Testing...</> : 'Test connection'}
              </button>
              {data.telegram_valid === true && <div className="wizard__status wizard__status--ok"><Check size={14} /> Connected to @{data.telegram_bot_name}</div>}
              {data.telegram_valid === false && <div className="wizard__status wizard__status--err"><X size={14} /> Invalid token</div>}
            </div>
            <CollapsibleInstructions title="How to find your Chat ID">
              <ol>
                <li>Search for <strong>@userinfobot</strong> on Telegram</li>
                <li>Send it any message</li>
                <li>It will reply with your user ID number</li>
                <li>Paste that number below</li>
              </ol>
            </CollapsibleInstructions>
            <div className="wizard__field">
              <label>Your Telegram Chat ID</label>
              <input value={data.telegram_chat_id} onChange={e => update({ telegram_chat_id: e.target.value })} placeholder="e.g., 123456789" />
              <span className="wizard__hint">This ensures only you can use the bot.</span>
            </div>
          </div>
        );

      case 'google':
        return (
          <div className="wizard__step">
            <h2><Calendar size={20} /> Google Calendar</h2>
            <p>LifeBoard can sync with your Google Calendar for events and holidays.</p>
            <CollapsibleInstructions title="How to set up Google Calendar API">
              <ol>
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener">Google Cloud Console</a></li>
                <li>Create a new project (name it "LifeBoard")</li>
                <li>Go to <strong>APIs & Services → Library</strong></li>
                <li>Search for "Google Calendar API" and <strong>Enable</strong> it</li>
                <li>Go to <strong>APIs & Services → Credentials</strong></li>
                <li>Click <strong>Create Credentials → OAuth client ID</strong></li>
                <li>Configure consent screen if prompted (External, add your email as test user)</li>
                <li>Application type: <strong>Web application</strong></li>
                <li>Add redirect URI: <code>http://localhost:8000/api/google/callback</code></li>
                <li>Copy the Client ID and Client Secret below</li>
              </ol>
            </CollapsibleInstructions>
            {!data.google_skip && (
              <>
                <div className="wizard__field">
                  <label>Google Client ID</label>
                  <input value={data.google_client_id} onChange={e => update({ google_client_id: e.target.value })} placeholder="123...apps.googleusercontent.com" />
                </div>
                <div className="wizard__field">
                  <label>Google Client Secret</label>
                  <input type="password" value={data.google_client_secret} onChange={e => update({ google_client_secret: e.target.value })} placeholder="GOCSPX-..." />
                </div>
                <span className="wizard__hint">You'll complete the connection after setup by visiting the dashboard.</span>
              </>
            )}
            <button className="wizard__skip-btn" onClick={() => update({ google_skip: !data.google_skip })}>
              {data.google_skip ? 'Actually, let me set it up' : 'Skip for now — I\'ll do this later'}
            </button>
          </div>
        );

      case 'health':
        return (
          <div className="wizard__step">
            <h2><Heart size={20} /> Health & Body</h2>
            <p>LifeBoard can track your nutrition, exercise, mood, and weight over time. All fields are optional — you can always update later.</p>
            <div className="wizard__field">
              <label>How tall are you? (cm)</label>
              <input type="number" value={data.health_height} onChange={e => update({ health_height: e.target.value })} placeholder="e.g., 175" />
            </div>
            <div className="wizard__field">
              <label>About how much do you weigh? (kg)</label>
              <input type="number" value={data.health_weight} onChange={e => update({ health_weight: e.target.value })} placeholder="e.g., 70" />
            </div>
            <div className="wizard__field">
              <label>How old are you?</label>
              <input type="number" value={data.health_age} onChange={e => update({ health_age: e.target.value })} placeholder="e.g., 28" />
            </div>
            <div className="wizard__field">
              <label>How active are you?</label>
              <select value={data.health_activity} onChange={e => update({ health_activity: e.target.value })}>
                <option value="sedentary">Sedentary — mostly sitting</option>
                <option value="light">Light — occasional walks</option>
                <option value="moderate">Moderate — regular exercise</option>
                <option value="active">Active — daily exercise</option>
                <option value="very_active">Very active — intense training</option>
              </select>
            </div>
            <div className="wizard__field">
              <label>Daily calorie goal? (optional)</label>
              <input type="number" value={data.health_calorie_goal} onChange={e => update({ health_calorie_goal: e.target.value })} placeholder="e.g., 2200" />
              <span className="wizard__hint">Leave blank and we'll suggest one based on your profile.</span>
            </div>
            <div className="wizard__agent-info">
              <p>The Health agent tracks meals, exercise, and mood from your Telegram messages. Just tell it what you ate or did — it handles the rest.</p>
              <p><strong>Dr. Fleet</strong> is your personal health consultant. Say "I want to see the doctor" in Telegram anytime.</p>
            </div>
          </div>
        );

      case 'finance':
        return (
          <div className="wizard__step">
            <h2><DollarSign size={20} /> Finance</h2>
            <p>LifeBoard tracks spending, budgets, and accounts. Tell Telegram what you spent — it categorizes automatically.</p>
            <div className="wizard__field">
              <label>What day of the month do you get paid?</label>
              <input type="number" min="1" max="31" value={data.pay_cycle_day} onChange={e => update({ pay_cycle_day: e.target.value })} />
              <span className="wizard__hint">Budgets are tracked against your pay cycle, not the calendar month.</span>
            </div>
            <div className="wizard__field">
              <label>How much do you take home each month? (after tax)</label>
              <input type="number" value={data.salary_amount} onChange={e => update({ salary_amount: e.target.value })} placeholder="e.g., 250000" />
              <span className="wizard__hint">This helps track your budget against actual income.</span>
            </div>
            <div className="wizard__agent-info">
              <p>You can add bank accounts from the dashboard. The finance agent handles multi-currency, budget alerts, and recurring payments.</p>
            </div>
          </div>
        );

      case 'investing':
        return (
          <div className="wizard__step">
            <h2><TrendingUp size={20} /> Investing</h2>
            <p>Track your portfolio across stocks, ETFs, and crypto.</p>
            <div className="wizard__field">
              <label>Do you own any stocks right now? Add one to get started (optional):</label>
              <input value={data.invest_symbol} onChange={e => update({ invest_symbol: e.target.value })} placeholder="e.g., AAPL" />
            </div>
            {data.invest_symbol && (
              <div className="wizard__row">
                <div className="wizard__field" style={{ flex: 1 }}>
                  <label>Shares</label>
                  <input type="number" value={data.invest_shares} onChange={e => update({ invest_shares: e.target.value })} placeholder="e.g., 10" />
                </div>
                <div className="wizard__field" style={{ flex: 1 }}>
                  <label>Buy price per share</label>
                  <input type="number" value={data.invest_price} onChange={e => update({ invest_price: e.target.value })} placeholder="e.g., 150" />
                </div>
              </div>
            )}
            <div className="wizard__agent-info">
              <p>The investing agent tracks portfolio value, fetches live prices daily, and converts between currencies. Add more holdings via Telegram or the dashboard.</p>
            </div>
          </div>
        );

      case 'reading':
        return (
          <div className="wizard__step">
            <h2><BookOpen size={20} /> Reading & Creative</h2>
            <p>A writing workspace and reading log for creative work.</p>
            <div className="wizard__field">
              <label>Are you reading anything right now?</label>
              <input value={data.reading_title} onChange={e => update({ reading_title: e.target.value })} placeholder="Book title" />
            </div>
            {data.reading_title && (
              <div className="wizard__field">
                <label>Who's it by?</label>
                <input value={data.reading_author} onChange={e => update({ reading_author: e.target.value })} placeholder="Author name" />
              </div>
            )}
            <div className="wizard__agent-info">
              <p>Capture creative ideas through Telegram — they get filed into your project folders. The workspace on desktop is a full markdown editor with live preview.</p>
            </div>
          </div>
        );

      case 'agents':
        return (
          <div className="wizard__step">
            <h2><FileText size={20} /> Documents & Fleet</h2>
            <div className="wizard__agent-info">
              <p><strong>Documents:</strong> Send any photo or PDF via Telegram. It gets classified, tagged, and stored automatically. Ask about your documents anytime — "what's my license number?"</p>
              <p><strong>Dr. Fleet:</strong> Your personal health consultant. Say "I want to see the doctor" in Telegram for a focused multi-turn consultation powered by Claude Opus. Fleet remembers your health history and active concerns.</p>
            </div>
          </div>
        );

      case 'restart':
        return (
          <div className="wizard__step">
            <h2>Almost there!</h2>
            <p>We need to restart LifeBoard to activate your new configuration.</p>
            <p className="wizard__hint">The API keys and settings you entered need a server restart to take effect. This is a one-time thing — after this, everything runs automatically.</p>
            <p>Click "Finish" below, then <strong>close and reopen the app</strong> using your start script (start.bat or start.sh).</p>
          </div>
        );

      case 'done':
        return (
          <div className="wizard__step wizard__step--done">
            <h1>You're all set, {data.display_name || 'friend'}!</h1>
            <p>Welcome to LifeBoard.</p>
            <div className="wizard__summary">
              {data.user_name && <div>Name: <strong>{data.user_name}</strong></div>}
              {data.timezone && <div>Timezone: <strong>{data.timezone}</strong></div>}
              {data.anthropic_valid && <div><Check size={14} /> Claude connected</div>}
              {data.telegram_valid && <div><Check size={14} /> Telegram bot @{data.telegram_bot_name}</div>}
              {data.google_client_id && <div><Check size={14} /> Google Calendar keys saved</div>}
              {data.google_skip && <div>Google Calendar: skipped (can set up later)</div>}
            </div>
            <button className="wizard__finish-btn" onClick={onComplete}>Open Dashboard</button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="wizard">
      <StepIndicator current={step} total={STEPS.length} />
      <div className="wizard__content">
        {renderStep()}
      </div>
      {currentStep !== 'welcome' && currentStep !== 'done' && (
        <div className="wizard__nav">
          <button className="wizard__nav-btn wizard__nav-btn--back" onClick={handleBack} disabled={step === 0}>
            <ChevronLeft size={16} /> Back
          </button>
          <span className="wizard__step-count">Step {step + 1} of {STEPS.length}</span>
          <button className="wizard__nav-btn wizard__nav-btn--next" onClick={handleNext} disabled={!canNext()}>
            {currentStep === 'restart' ? 'Finish' : 'Next'} <ChevronRight size={16} />
          </button>
        </div>
      )}
      {currentStep === 'welcome' && (
        <div className="wizard__nav wizard__nav--center">
          <button className="wizard__nav-btn wizard__nav-btn--next wizard__nav-btn--start" onClick={handleNext}>
            Let's go <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
