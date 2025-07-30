module.exports = {
  apps: [
    {
      name: 'whatslandllt-backend',
      script: './backend/server.js',
      cwd: '/var/www/whatslandllt',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
        HOST: '0.0.0.0'
      },
      error_file: '/var/log/pm2/whatslandllt-error.log',
      out_file: '/var/log/pm2/whatslandllt-out.log',
      log_file: '/var/log/pm2/whatslandllt-combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '30s'
    },
    {
      name: 'whatslandllt-frontend',
      script: 'serve',
      args: '-s dist -l 3000 -H 0.0.0.0',
      cwd: '/var/www/whatslandllt/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/frontend-error.log',
      out_file: '/var/log/pm2/frontend-out.log',
      log_file: '/var/log/pm2/frontend-combined.log',
      time: true
    }
  ]
}; 