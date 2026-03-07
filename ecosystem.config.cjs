module.exports = {
  apps: [
    {
      name: "ran-backend",
      cwd: "./ran-backend",
      script: "src/server.js",
      node_args: "--experimental-modules",
      env: {
        NODE_ENV: "production",
        PORT: 1669,
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: "ran-frontend",
      cwd: "./ran-frontend",
      script: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "localhost",
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
