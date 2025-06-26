module.exports = {
    apps: [
        {
            name: 'dbuzz-image-service',
            script: 'server.js',
            instances: 'max', // Use all available CPU cores
            exec_mode: 'cluster',
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development',
                PORT: 3000,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_file: './logs/combined.log',
            time: true,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 4000,
            kill_timeout: 5000,
            listen_timeout: 3000,
            shutdown_with_message: true,
            wait_ready: true,
            // Health check
            health_check_grace_period: 3000,
            // Monitoring
            pmx: true,
            monitoring: false,
            // Log rotation
            log_date_format: 'YYYY-MM-DD HH:mm Z',
            merge_logs: true,
            // Advanced PM2 features
            increment_var: 'PORT',
            combine_logs: true,
            // Environment variables
            env_file: '.env',
        },
    ],

    deploy: {
        production: {
            user: 'node',
            host: 'your-server.com',
            ref: 'origin/main',
            repo: 'git@github.com:your-repo/dbuzz-image-service.git',
            path: '/var/www/production',
            'pre-deploy-local': '',
            'post-deploy':
                'npm install && pm2 reload ecosystem.config.js --env production',
            'pre-setup': '',
        },
    },
}
