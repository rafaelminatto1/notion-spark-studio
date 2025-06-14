import '@testing-library/cypress/add-commands';

// Comandos personalizados
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
});

Cypress.Commands.add('createTemplate', (name: string, description: string) => {
  cy.get('[data-testid="create-template-button"]').click();
  cy.get('[data-testid="template-name-input"]').type(name);
  cy.get('[data-testid="template-description-input"]').type(description);
  cy.get('[data-testid="save-template-button"]').click();
});

Cypress.Commands.add('waitForWebSocket', () => {
  cy.window().then((win) => {
    return new Cypress.Promise((resolve) => {
      const checkConnection = () => {
        if (win.WebSocket && win.WebSocket.readyState === WebSocket.OPEN) {
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  });
});

// Tipos para TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createTemplate(name: string, description: string): Chainable<void>;
      waitForWebSocket(): Chainable<void>;
    }
  }
} 