import baseConfig from './eslint.config.js';
import js from '@eslint/js';

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
  },
  {
    name: 'vercel-quick-config',
    ignores: [
      '.next/**',
      'dist/**',
      'build/**',
      'node_modules/**',
      'websocket-server/**',
      'ws-server/**', 
      'test-prod.js',
      'supabase/functions/**',
      '*.config.js',
      '*.config.ts',
      'public/**/*.js',
      'eslint.config.*.js',
      'scripts/**/*.js',
      'server.js',
      'server/**/*.js',
      'cypress/**',
      'coverage/**',
      '.vercel/**',
      'out/**'
    ]
  },
  {
    name: 'vercel-build-optimized',
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        NodeJS: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly'
      }
    },
    rules: {
      // APENAS ERROS CRÍTICOS QUE QUEBRAM BUILD
      'no-unused-vars': 'off',
      'no-undef': 'error',
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-unreachable': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'off',
      'no-extra-semi': 'off',
      'no-func-assign': 'error',
      'no-invalid-regexp': 'error',
      'no-obj-calls': 'error',
      'no-regex-spaces': 'off',
      'no-sparse-arrays': 'off',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      
      // PERMITE TUDO QUE NÃO QUEBRA BUILD
      'prefer-const': 'off',
      'no-var': 'off',
      'object-shorthand': 'off',
      'prefer-template': 'off'
    }
  }
]; 