
import { useCallback } from 'react';
import { FileItem } from '@/types';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (file: FileItem) => ValidationResult;
  enabled: boolean;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  suggestions?: string[];
}

export const useValidation = () => {
  const defaultRules: ValidationRule[] = [
    {
      id: 'name-length',
      name: 'Nome do arquivo',
      description: 'Nome deve ter entre 1 e 100 caracteres',
      severity: 'error',
      enabled: true,
      validate: (file: FileItem): ValidationResult => {
        if (!file.name || file.name.trim().length === 0) {
          return {
            isValid: false,
            message: 'Nome do arquivo não pode estar vazio',
            suggestions: ['Adicione um nome descritivo ao arquivo']
          };
        }
        if (file.name.length > 100) {
          return {
            isValid: false,
            message: 'Nome muito longo (máximo 100 caracteres)',
            suggestions: ['Reduza o nome do arquivo']
          };
        }
        return { isValid: true };
      }
    },
    {
      id: 'content-size',
      name: 'Tamanho do conteúdo',
      description: 'Conteúdo muito grande pode afetar a performance',
      severity: 'warning',
      enabled: true,
      validate: (file: FileItem): ValidationResult => {
        const content = file.content || '';
        const size = new Blob([content]).size;
        const maxSize = 1024 * 1024; // 1MB
        
        if (size > maxSize) {
          return {
            isValid: false,
            message: `Arquivo muito grande (${Math.round(size / 1024)}KB)`,
            suggestions: [
              'Considere dividir em arquivos menores',
              'Remova conteúdo desnecessário'
            ]
          };
        }
        return { isValid: true };
      }
    },
    {
      id: 'broken-links',
      name: 'Links quebrados',
      description: 'Verificar se links internos existem',
      severity: 'warning',
      enabled: true,
      validate: (file: FileItem): ValidationResult => {
        const content = file.content || '';
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        const matches = Array.from(content.matchAll(linkRegex));
        
        if (matches.length > 0) {
          return {
            isValid: false,
            message: `${matches.length} link(s) interno(s) encontrado(s)`,
            suggestions: ['Verifique se os arquivos linkados existem']
          };
        }
        return { isValid: true };
      }
    },
    {
      id: 'empty-content',
      name: 'Conteúdo vazio',
      description: 'Arquivo sem conteúdo',
      severity: 'info',
      enabled: true,
      validate: (file: FileItem): ValidationResult => {
        const content = file.content || '';
        if (content.trim().length === 0) {
          return {
            isValid: false,
            message: 'Arquivo sem conteúdo',
            suggestions: ['Adicione conteúdo ao arquivo']
          };
        }
        return { isValid: true };
      }
    }
  ];

  const validateFile = useCallback((file: FileItem, rules?: ValidationRule[]) => {
    const rulesToUse = rules || defaultRules;
    const results: Array<ValidationResult & { rule: ValidationRule }> = [];

    rulesToUse.forEach(rule => {
      if (rule.enabled) {
        const result = rule.validate(file);
        if (!result.isValid) {
          results.push({ ...result, rule });
        }
      }
    });

    return {
      isValid: results.length === 0,
      errors: results.filter(r => r.rule.severity === 'error'),
      warnings: results.filter(r => r.rule.severity === 'warning'),
      info: results.filter(r => r.rule.severity === 'info'),
      allResults: results
    };
  }, []);

  const validateMultipleFiles = useCallback((files: FileItem[], rules?: ValidationRule[]) => {
    const results = files.map(file => ({
      file,
      validation: validateFile(file, rules)
    }));

    return {
      totalFiles: files.length,
      validFiles: results.filter(r => r.validation.isValid).length,
      filesWithErrors: results.filter(r => r.validation.errors.length > 0),
      filesWithWarnings: results.filter(r => r.validation.warnings.length > 0),
      allResults: results
    };
  }, [validateFile]);

  return {
    defaultRules,
    validateFile,
    validateMultipleFiles
  };
};
