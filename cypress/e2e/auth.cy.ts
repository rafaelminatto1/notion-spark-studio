describe('Autenticação', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve fazer login com sucesso', () => {
    const email = Cypress.env('TEST_USER_EMAIL');
    const password = Cypress.env('TEST_USER_PASSWORD');

    cy.login(email, password);
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  it('deve mostrar erro com credenciais inválidas', () => {
    cy.login('invalid@email.com', 'wrongpassword');
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Credenciais inválidas');
  });

  it('deve fazer logout com sucesso', () => {
    const email = Cypress.env('TEST_USER_EMAIL');
    const password = Cypress.env('TEST_USER_PASSWORD');

    cy.login(email, password);
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();
    cy.url().should('include', '/login');
  });

  it('deve redirecionar para login quando não autenticado', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });
}); 