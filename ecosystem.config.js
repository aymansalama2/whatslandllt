module.exports = {
  apps: [{
    name: 'whatsland',
    script: 'backend/server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=256'
    },
    merge_logs: true,
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    node_args: [
      '--optimize-for-size',
      '--max-old-space-size=256',
      '--gc-interval=100'
    ]
  }]
}