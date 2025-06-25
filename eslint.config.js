import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { FlatCompat } from '@eslint/eslintrc';

// FlatCompat for legacy config support
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

export default tseslint.config(
  // Base configurations
  js.configs.recommended,
  ...tseslint.configs.recommended,
  
  // Next.js specific configurations - must come last per documentation
  ...compat.config({
    extends: [
      'next/core-web-vitals',  // Core Web Vitals rules for performance
      'next/typescript',       // TypeScript-specific Next.js rules
      'prettier'               // Prettier integration to avoid conflicts
    ],
  }),
  
  {
    ignores: [
      'dist/**',
      '.next/**',
      'node_modules/**',
      'coverage/**',
      '.vercel/**',
      'out/**',
      'build/**',
      '*.config.js',
      '*.config.ts',
      'public/**',
      '.env*',
      // Cypress files
      'cypress/**',
      // MCP Vercel files
      'mcp-vercel/**',
      // Scripts
      'scripts/**',
      'server/**',
      'server.js',
      // Generated files
      'fix-critical-issues.js',
      // Test output files
      '*.txt'
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020
      },
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
      
      // React Refresh rules for development
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      
      // TypeScript best practices (less strict than previous config)
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      
      // JavaScript best practices
      "prefer-const": "warn",
      "no-var": "error",
      "object-shorthand": "warn",
      "prefer-template": "warn",
      
      // Next.js specific optimizations (these come from next/core-web-vitals)
      // These are automatically included but can be customized if needed
      "@next/next/no-img-element": "error",
      "@next/next/no-page-custom-font": "warn",
      
      // Disable some overly strict TypeScript rules for better DX
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off", 
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/require-await": "off"
    },
  }
);
