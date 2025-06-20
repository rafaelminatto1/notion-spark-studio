/// <reference types="cypress" />

describe('Notion Spark Studio - Complete App Flow', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('/');
    
    // Wait for initial load
    cy.get('[data-testid="app-loaded"]', { timeout: 10000 })
      .should('be.visible')
      .or(() => cy.get('body').should('be.visible'));
    
    // Check for performance metrics initialization
    cy.window().its('performance').should('exist');
  });

  describe('Application Initialization', () => {
    it('should load the homepage successfully', () => {
      cy.title().should('contain', 'Notion Spark Studio');
      
      // Check for main navigation
      cy.get('nav').should('be.visible');
      
      // Check for performance indicators
      cy.get('[data-testid="performance-indicator"]')
        .should('be.visible')
        .or(() => cy.get('body').should('contain.text', 'Performance'));
    });

    it('should initialize all core systems', () => {
      // Check for AI Performance Optimizer
      cy.window().then((win) => {
        expect(win.console.log).to.have.been.calledWith(
          Cypress.sinon.match('🤖 Inicializando AI Performance Optimizer')
        );
      });

      // Check for Analytics Engine
      cy.get('[data-testid="analytics-status"]')
        .should('exist')
        .or(() => cy.get('body').should('contain.text', 'Analytics'));

      // Check for Collaboration System
      cy.get('[data-testid="collaboration-status"]')
        .should('exist')
        .or(() => cy.get('body').should('contain.text', 'Collaboration'));
    });

    it('should measure initial performance metrics', () => {
      cy.task('measurePerformance').then((metrics) => {
        expect(metrics).to.have.property('timestamp');
        expect(metrics).to.have.property('memory');
      });

      // Check page load time
      cy.window().its('performance.timing').then((timing) => {
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        expect(loadTime).to.be.lessThan(5000); // Less than 5 seconds
      });
    });
  });

  describe('Search Functionality', () => {
    it('should perform advanced search operations', () => {
      // Navigate to search
      cy.get('[data-testid="search-input"]')
        .should('be.visible')
        .type('machine learning');

      // Wait for search results
      cy.get('[data-testid="search-results"]', { timeout: 5000 })
        .should('be.visible');

      // Check search analytics
      cy.get('[data-testid="search-analytics"]')
        .should('contain.text', 'Total Queries')
        .and('contain.text', 'Avg Response');

      // Test search filters
      cy.get('[data-testid="search-filters"]').within(() => {
        cy.get('[data-testid="filter-type"]').click();
        cy.get('[data-value="document"]').click();
      });

      // Verify filtered results
      cy.get('[data-testid="search-results"]')
        .find('[data-type="document"]')
        .should('have.length.greaterThan', 0);
    });

    it('should provide search suggestions', () => {
      cy.get('[data-testid="search-input"]').type('learn');

      cy.get('[data-testid="search-suggestions"]')
        .should('be.visible')
        .and('contain.text', 'machine learning');

      // Click on suggestion
      cy.get('[data-testid="suggestion-item"]').first().click();

      // Verify search input updated
      cy.get('[data-testid="search-input"]')
        .should('have.value', 'machine learning');
    });

    it('should track search analytics', () => {
      // Perform multiple searches
      const searchTerms = ['AI', 'performance', 'optimization'];

      searchTerms.forEach((term) => {
        cy.get('[data-testid="search-input"]')
          .clear()
          .type(term)
          .type('{enter}');

        cy.wait(500);
      });

      // Check trending queries
      cy.get('[data-testid="trending-queries"]')
        .should('be.visible')
        .and('contain.text', 'AI');
    });
  });

  describe('Performance Monitoring', () => {
    it('should display real-time performance metrics', () => {
      cy.visit('/performance');

      // Check performance dashboard
      cy.get('[data-testid="performance-dashboard"]')
        .should('be.visible');

      // Verify key metrics
      cy.get('[data-testid="fps-metric"]')
        .should('be.visible')
        .and('contain.text', 'FPS');

      cy.get('[data-testid="memory-metric"]')
        .should('be.visible')
        .and('contain.text', 'Memory');

      cy.get('[data-testid="latency-metric"]')
        .should('be.visible')
        .and('contain.text', 'Latency');

      // Check performance score
      cy.get('[data-testid="performance-score"]')
        .should('be.visible')
        .invoke('text')
        .then((text) => {
          const score = parseInt(text);
          expect(score).to.be.greaterThan(0);
          expect(score).to.be.lessThan(101);
        });
    });

    it('should monitor performance over time', () => {
      cy.visit('/performance');

      // Start monitoring
      cy.get('[data-testid="start-monitoring"]').click();

      // Wait for metrics collection
      cy.wait(3000);

      // Check metrics history
      cy.get('[data-testid="metrics-history"]')
        .should('be.visible')
        .find('[data-testid="metric-entry"]')
        .should('have.length.greaterThan', 1);

      // Stop monitoring
      cy.get('[data-testid="stop-monitoring"]').click();
    });

    it('should generate performance alerts', () => {
      cy.visit('/performance');

      // Simulate high memory usage (mock)
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('high-memory-usage', {
          detail: { usage: 0.95 }
        }));
      });

      // Check for alert
      cy.get('[data-testid="performance-alerts"]')
        .should('be.visible')
        .and('contain.text', 'Memória');
    });
  });

  describe('System Integration', () => {
    it('should test AI performance optimization', () => {
      cy.visit('/systems');

      // Check AI optimizer status
      cy.get('[data-testid="ai-optimizer-status"]')
        .should('be.visible')
        .and('contain.text', 'Active');

      // Trigger optimization
      cy.get('[data-testid="run-optimization"]').click();

      // Check optimization results
      cy.get('[data-testid="optimization-results"]', { timeout: 10000 })
        .should('be.visible')
        .and('contain.text', 'Optimization completed');
    });

    it('should test real-time collaboration', () => {
      cy.visit('/collaboration');

      // Check collaboration status
      cy.get('[data-testid="collaboration-status"]')
        .should('be.visible')
        .and('contain.text', 'Connected');

      // Test document editing
      cy.get('[data-testid="collaborative-editor"]')
        .should('be.visible')
        .type('Test collaboration content');

      // Check for collaboration indicators
      cy.get('[data-testid="active-users"]')
        .should('be.visible');

      cy.get('[data-testid="sync-status"]')
        .should('be.visible')
        .and('contain.text', 'Synced');
    });

    it('should test offline functionality', () => {
      // Simulate offline
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          writable: true,
          value: false
        });
      });

      // Test offline queue
      cy.get('[data-testid="offline-indicator"]')
        .should('be.visible')
        .and('contain.text', 'Offline');

      // Create operation while offline
      cy.get('[data-testid="create-document"]').click();
      cy.get('[data-testid="document-title"]').type('Offline Document');
      cy.get('[data-testid="save-document"]').click();

      // Check offline queue
      cy.get('[data-testid="offline-queue"]')
        .should('be.visible')
        .and('contain.text', '1 operation');

      // Simulate back online
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          writable: true,
          value: true
        });
        win.dispatchEvent(new Event('online'));
      });

      // Check sync
      cy.get('[data-testid="sync-status"]')
        .should('contain.text', 'Syncing');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should work on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/');

      // Check mobile navigation
      cy.get('[data-testid="mobile-menu-toggle"]')
        .should('be.visible')
        .click();

      cy.get('[data-testid="mobile-menu"]')
        .should('be.visible');

      // Test mobile search
      cy.get('[data-testid="mobile-search"]')
        .should('be.visible')
        .type('test search');

      // Check mobile performance
      cy.get('[data-testid="mobile-performance"]')
        .should('be.visible');
    });

    it('should handle touch interactions', () => {
      cy.viewport('ipad-2');
      cy.visit('/');

      // Test swipe gestures (simulated)
      cy.get('[data-testid="swipeable-content"]')
        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
        .trigger('touchmove', { touches: [{ clientX: 200, clientY: 100 }] })
        .trigger('touchend');

      // Test pinch zoom (simulated)
      cy.get('[data-testid="zoomable-content"]')
        .trigger('touchstart', { 
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 }
          ] 
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Intercept and fail API calls
      cy.intercept('GET', '/api/**', { forceNetworkError: true }).as('apiError');

      cy.visit('/');

      // Check error boundary
      cy.get('[data-testid="error-boundary"]')
        .should('be.visible')
        .or(() => cy.get('[data-testid="error-message"]').should('be.visible'));

      // Test retry functionality
      cy.get('[data-testid="retry-button"]').click();

      // Restore network and verify recovery
      cy.intercept('GET', '/api/**', { fixture: 'api-success.json' });
      cy.get('[data-testid="loading-indicator"]').should('be.visible');
    });

    it('should handle JavaScript errors', () => {
      cy.visit('/');

      // Trigger a JavaScript error
      cy.window().then((win) => {
        win.eval('throw new Error("Test error")');
      });

      // Check error reporting
      cy.get('[data-testid="error-reporter"]')
        .should('exist')
        .or(() => cy.window().its('console.error').should('have.been.called'));
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance benchmarks', () => {
      cy.visit('/');

      // Measure Core Web Vitals
      cy.window().then((win) => {
        return new Promise((resolve) => {
          new win.PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint');
            if (lcp) {
              expect(lcp.startTime).to.be.lessThan(2500); // LCP < 2.5s
              resolve(lcp.startTime);
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });
        });
      });

      // Check bundle size impact
      cy.window().its('performance.getEntriesByType', 'navigation')
        .then((entries) => {
          const navigation = entries[0] as PerformanceNavigationTiming;
          const loadTime = navigation.loadEventEnd - navigation.navigationStart;
          expect(loadTime).to.be.lessThan(3000); // Total load < 3s
        });

      // Check memory usage
      cy.window().then((win) => {
        if ('memory' in win.performance) {
          const memory = (win.performance as any).memory;
          const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
          expect(memoryUsage).to.be.lessThan(0.8); // Memory usage < 80%
        }
      });
    });
  });

  afterEach(() => {
    // Clean up any test data
    cy.task('cleanupDatabase');
    
    // Take screenshot on failure
    cy.screenshot();
  });
}); 