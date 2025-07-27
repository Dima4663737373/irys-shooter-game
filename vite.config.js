export default {
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    },
    // Copy additional files to dist
    copyPublicDir: true
  },
  // Ensure all JS files are treated as assets
  assetsInclude: ['**/*.js']
} 