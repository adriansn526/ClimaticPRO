module.exports = {
  apps: [
    {
      name: 'climaticpro-dev',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/asns/projects/climaticpro/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      error_file: '/home/asns/projects/climaticpro/frontend/logs/pm2-error.log',
      out_file: '/home/asns/projects/climaticpro/frontend/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    }
  ]
};
