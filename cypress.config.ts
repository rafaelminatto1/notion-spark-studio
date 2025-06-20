import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Test files configuration
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    
    // Test behavior
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Video and screenshot settings
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    
    // Browser settings
    chromeWebSecurity: false,
    
    // Environment variables
    env: {
      API_URL: 'http://localhost:3000/api',
      TEST_USER_EMAIL: 'test@example.com',
      TEST_USER_PASSWORD: 'testpassword123'
    },
    
    setupNodeEvents(on, config) {
      // Task definitions
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        
        // Performance testing helpers
        measurePerformance() {
          return {
            timestamp: Date.now(),
            memory: process.memoryUsage(),
            loadTime: 0
          };
        },
        
        // Database seeding for tests
        seedDatabase() {
          console.log('Seeding test database...');
          return null;
        },
        
        // Clean up test data
        cleanupDatabase() {
          console.log('Cleaning up test database...');
          return null;
        }
      });

      // Custom event handlers
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-web-security');
        }
        
        return launchOptions;
      });

      // Performance monitoring
      on('after:screenshot', (details) => {
        console.log('Screenshot taken:', details.path);
      });

      return config;
    },
    
    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Experimental features
    experimentalStudio: true,
    experimentalMemoryManagement: true
  },
  
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
    indexHtmlFile: 'cypress/support/component-index.html',
    viewportWidth: 1280,
    viewportHeight: 720,
  },
  
  // Global configuration
  watchForFileChanges: true,
  numTestsKeptInMemory: 50,
  
  // Reporter configuration for CI/CD
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'cypress/reports',
    overwrite: false,
    html: true,
    json: true,
    timestamp: 'mmddyyyy_HHMMss'
  }
}); 