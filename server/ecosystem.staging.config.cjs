module.exports = {
  apps: [{
    name: 'SkinAnvil-Staging',
    script: 'server.mjs',  // Note: Updated to .mjs to match rollup output
    env: {
      NODE_ENV: 'production',
      PORT: 3003
    },
    watch: true,
    ignore_watch: ['node_modules'],
    max_memory_restart: '300M'
  }]
}
