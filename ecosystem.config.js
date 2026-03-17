/**
 * PM2 ecosystem configuration for LifeBoard.
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 stop lifeboard-backend
 *   pm2 logs
 *   pm2 status
 */
module.exports = {
  apps: [
    {
      name: "lifeboard-backend",
      script: "uvicorn",
      args: "backend.main:app --host 0.0.0.0 --port 8000",
      cwd: __dirname,
      interpreter: "none",
      env: {
        ENV: "production",
      },
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
