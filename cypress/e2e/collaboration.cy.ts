describe('Colaboração em Tempo Real', () => {
  beforeEach(() => {
    const email = Cypress.env('TEST_USER_EMAIL');
    const password = Cypress.env('TEST_USER_PASSWORD');
    cy.login(email, password);
    cy.waitForWebSocket();
  });

  it('deve conectar ao WebSocket com sucesso', () => {
    cy.window().then((win) => {
      expect(win.WebSocket).to.exist;
      expect(win.WebSocket.readyState).to.equal(WebSocket.OPEN);
    });
  });

  it('deve criar e compartilhar um template', () => {
    const templateName = `Test Template ${Date.now()}`;
    const templateDescription = 'Template para teste de colaboração';

    cy.createTemplate(templateName, templateDescription);
    cy.get('[data-testid="share-button"]').click();
    cy.get('[data-testid="share-link"]').should('be.visible');
  });

  it('deve receber atualizações em tempo real', () => {
    // Criar um template
    const templateName = `Test Template ${Date.now()}`;
    cy.createTemplate(templateName, 'Template para teste de atualizações');

    // Simular atualização de outro usuário
    cy.window().then((win) => {
      const ws = new WebSocket(Cypress.env('wsUrl'));
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'update',
          templateId: 'test-template-id',
          changes: { title: 'Updated Title' }
        }));
      };
    });

    // Verificar se a atualização foi recebida
    cy.get('[data-testid="template-title"]')
      .should('contain', 'Updated Title');
  });

  it('deve mostrar indicador de usuários online', () => {
    cy.get('[data-testid="online-users"]').should('be.visible');
    cy.get('[data-testid="online-users-count"]')
      .should('be.visible')
      .and('contain', '1');
  });

  it('deve lidar com reconexão do WebSocket', () => {
    // Simular desconexão
    cy.window().then((win) => {
      const ws = win.WebSocket;
      ws.close();
    });

    // Verificar reconexão
    cy.waitForWebSocket();
    cy.get('[data-testid="connection-status"]')
      .should('be.visible')
      .and('contain', 'Conectado');
  });
}); 