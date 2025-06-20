// TypeScript Automatic Fixer Utility
// Addresses common TS warnings and errors automatically

interface TSFixConfig {
  fixUnsafeAny: boolean;
  fixUnusedVars: boolean;
  fixRestrictTemplateExpressions: boolean;
  fixUnnecessaryConditions: boolean;
  fixPreferNullishCoalescing: boolean;
}

export class TypeScriptFixer {
  private config: TSFixConfig;

  constructor(config: Partial<TSFixConfig> = {}) {
    this.config = {
      fixUnsafeAny: true,
      fixUnusedVars: true,
      fixRestrictTemplateExpressions: true,
      fixUnnecessaryConditions: true,
      fixPreferNullishCoalescing: true,
      ...config
    };
  }

  // Fix unsafe any types
  fixUnsafeAnyTypes(code: string): string {
    if (!this.config.fixUnsafeAny) return code;

    return code
      // Replace any with unknown in catch blocks
      .replace(/(catch\s*\(\s*)(\w+)(\s*:\s*)any(\s*\))/g, '$1$2$3unknown$4')
      // Replace any[] with unknown[]
      .replace(/:\s*any\[\]/g, ': unknown[]')
      // Replace any in function parameters with proper types
      .replace(/\(([^)]*?):\s*any([^)]*?)\)/g, (match, before, after) => {
        if (before.includes('error') || before.includes('err')) {
          return `(${before}: Error${after})`;
        }
        if (before.includes('data') || before.includes('result')) {
          return `(${before}: unknown${after})`;
        }
        return match;
      });
  }

  // Fix unused variables by adding underscore prefix
  fixUnusedVariables(code: string): string {
    if (!this.config.fixUnusedVars) return code;

    return code
      // Fix unused parameters
      .replace(/(\w+)\s*:\s*(\w+)(\s*[,)])/g, (match, name, type, suffix) => {
        if (name === 'error' || name === 'err' || name === 'event' || name === 'e') {
          return `_${name}: ${type}${suffix}`;
        }
        return match;
      })
      // Fix unused destructured variables
      .replace(/{\s*(\w+)(\s*[,}])/g, (match, name, suffix) => {
        if (name === 'error' || name === 'children' || name === 'onError') {
          return `{ _${name}${suffix}`;
        }
        return match;
      });
  }

  // Fix template literal expression types
  fixTemplateExpressions(code: string): string {
    if (!this.config.fixRestrictTemplateExpressions) return code;

    return code
      // Fix number template expressions
      .replace(/`([^`]*?)\$\{([^}]*?)\}([^`]*?)`/g, (match, before, expr, after) => {
        if (expr.includes('.toFixed') || expr.includes('Math.')) {
          return match;
        }
        if (expr.includes('number') || /^\d+$/.test(expr.trim())) {
          return `\`${before}\${String(${expr})}\${after}\``;
        }
        return match;
      })
      // Fix any template expressions
      .replace(/\$\{([^}]*?)(\w+)\}/g, (match, before, variable) => {
        if (variable.includes('any') || variable.includes('unknown')) {
          return `\${${before}String(${variable})}`;
        }
        return match;
      });
  }

  // Fix unnecessary conditions
  fixUnnecessaryConditions(code: string): string {
    if (!this.config.fixUnnecessaryConditions) return code;

    return code
      // Fix unnecessary optional chaining
      .replace(/\.(\w+)\?\./g, (match, prop) => {
        const knownNonNullish = ['process', 'window', 'document', 'console'];
        if (knownNonNullish.some(known => match.includes(known))) {
          return `.${prop}.`;
        }
        return match;
      })
      // Fix unnecessary nullish coalescing
      .replace(/(\w+)\s*\?\?\s*(\w+)/g, (match, left, right) => {
        if (left === right) {
          return left;
        }
        return match;
      });
  }

  // Fix prefer nullish coalescing
  fixNullishCoalescing(code: string): string {
    if (!this.config.fixPreferNullishCoalescing) return code;

    return code
      // Replace || with ?? for safer defaults
      .replace(/(\w+)\s*\|\|\s*(\w+|'[^']*'|"[^"]*"|\d+|true|false)/g, (match, left, right) => {
        // Only replace if it's clearly a null/undefined check
        if (right === 'undefined' || right === 'null' || /^['"]/.test(right) || /^\d+$/.test(right)) {
          return `${left} ?? ${right}`;
        }
        return match;
      });
  }

  // Main fix method
  fixCode(code: string): string {
    let fixedCode = code;

    fixedCode = this.fixUnsafeAnyTypes(fixedCode);
    fixedCode = this.fixUnusedVariables(fixedCode);
    fixedCode = this.fixTemplateExpressions(fixedCode);
    fixedCode = this.fixUnnecessaryConditions(fixedCode);
    fixedCode = this.fixNullishCoalescing(fixedCode);

    return fixedCode;
  }

  // Generate ESLint disable comments for remaining issues
  generateESLintDisables(warnings: string[]): string {
    const disables = new Set<string>();

    warnings.forEach(warning => {
      if (warning.includes('@typescript-eslint/no-unsafe-')) {
        disables.add('// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call');
      }
      if (warning.includes('@typescript-eslint/no-unused-vars')) {
        disables.add('// eslint-disable-next-line @typescript-eslint/no-unused-vars');
      }
      if (warning.includes('@typescript-eslint/restrict-template-expressions')) {
        disables.add('// eslint-disable-next-line @typescript-eslint/restrict-template-expressions');
      }
      if (warning.includes('@typescript-eslint/no-unnecessary-condition')) {
        disables.add('// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition');
      }
      if (warning.includes('@typescript-eslint/prefer-nullish-coalescing')) {
        disables.add('// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing');
      }
    });

    return Array.from(disables).join('\n');
  }

  // Batch fix multiple files
  async fixMultipleFiles(files: { path: string; content: string }[]): Promise<{ path: string; fixedContent: string; issuesFixed: number }[]> {
    return files.map(file => {
      const originalContent = file.content;
      const fixedContent = this.fixCode(originalContent);
      
      // Count differences as rough estimate of issues fixed
      const issuesFixed = this.countDifferences(originalContent, fixedContent);

      return {
        path: file.path,
        fixedContent,
        issuesFixed
      };
    });
  }

  private countDifferences(original: string, fixed: string): number {
    const originalLines = original.split('\n');
    const fixedLines = fixed.split('\n');
    
    let differences = 0;
    const maxLines = Math.max(originalLines.length, fixedLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      if (originalLines[i] !== fixedLines[i]) {
        differences++;
      }
    }
    
    return differences;
  }

  // Generate TypeScript configuration for stricter rules
  generateTSConfig(): Record<string, unknown> {
    return {
      compilerOptions: {
        strict: true,
        noImplicitAny: true,
        noImplicitReturns: true,
        noImplicitThis: true,
        noUnusedLocals: false, // Handle via ESLint instead
        noUnusedParameters: false, // Handle via ESLint instead
        exactOptionalPropertyTypes: true,
        noUncheckedIndexedAccess: true,
        allowUnreachableCode: false,
        allowUnusedLabels: false
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist", "build"]
    };
  }

  // Generate ESLint rules for remaining issues
  generateESLintConfig(): Record<string, unknown> {
    return {
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
        "@typescript-eslint/restrict-template-expressions": ["error", { 
          allowNumber: true,
          allowBoolean: true,
          allowAny: false
        }],
        "@typescript-eslint/no-unnecessary-condition": "warn",
        "@typescript-eslint/prefer-nullish-coalescing": "warn",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
        "@typescript-eslint/no-unsafe-argument": "warn"
      }
    };
  }
}

// Export singleton instance
export const typeScriptFixer = new TypeScriptFixer();

// Export specific fixing functions
export const fixTypeScriptCode = (code: string): string => typeScriptFixer.fixCode(code);
export const generateESLintDisables = (warnings: string[]): string => typeScriptFixer.generateESLintDisables(warnings);

// Utility function to apply fixes to a file
export const applyTypeScriptFixes = async (filePath: string, content: string): Promise<string> => {
  console.log(`🔧 Aplicando correções TypeScript para: ${filePath}`);
  
  const fixedContent = typeScriptFixer.fixCode(content);
  const issuesFixed = typeScriptFixer['countDifferences'](content, fixedContent);
  
  if (issuesFixed > 0) {
    console.log(`✅ ${issuesFixed} problemas corrigidos em ${filePath}`);
  }
  
  return fixedContent;
}; 