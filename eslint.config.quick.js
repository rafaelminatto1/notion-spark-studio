import baseConfig from './eslint.config.js';

// Configuração RÁPIDA - Desabilita temporariamente regras que impedem desenvolvimento
export default [
  ...baseConfig,
  {
    name: 'quick-development-overrides',
    rules: {
      // Desabilitadas temporariamente para foco em funcionalidades
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn', 
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-misused-promises': 'warn',
      
      // Manter apenas regras críticas
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': 'warn',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
]; 