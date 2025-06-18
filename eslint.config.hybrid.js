import js from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

const baseConfig = [
  js.configs.recommended,
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      },
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
        NodeJS: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsEslint,
      'react-hooks': reactHooks
    }
  }
];

// Configuração HÍBRIDA - Regras inteligentes baseadas em contexto
export default [
  ...baseConfig,
  {
    name: 'hybrid-ignores',
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
      'server/**/*.js'
    ]
  },
  {
    name: 'hybrid-core-strict',
    files: ['src/workers/**', 'src/services/**', 'src/lib/**'],
    rules: {
      // STRICT TYPE SAFETY para core modules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off', // Allow for Supabase
      '@typescript-eslint/no-unsafe-call': 'off', // Allow for Supabase
      '@typescript-eslint/no-unsafe-member-access': 'off', // Allow for Supabase
      '@typescript-eslint/no-unsafe-return': 'off', // Allow for Supabase
      '@typescript-eslint/no-unsafe-argument': 'off', // Allow for Supabase
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  },
  {
    name: 'hybrid-ui-relaxed',
    files: ['src/components/**', 'src/pages/**', 'src/app/**'],
    rules: {
      // RELAXED para UI components
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off', 
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      'no-unused-vars': 'warn'
    }
  },
  {
    name: 'hybrid-hooks-strict',
    files: ['src/hooks/**'],
    rules: {
      // STRICT para hooks
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },
  {
    name: 'hybrid-tests-relaxed',
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        global: 'readonly'
      }
    },
    rules: {
      // RELAXED para testes
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      'no-unused-vars': 'off'
    }
  },
  {
    name: 'hybrid-utils-balanced',
    files: ['src/utils/**'],
    rules: {
      // BALANCED para utils
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/require-await': 'warn',
      'no-unused-vars': 'warn'
    }
  }
]; 