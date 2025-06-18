import type { FileItem } from '@/types';

// Tipos para o sistema de AI Tagging
export interface TagSuggestion {
  tag: string;
  confidence: number;
  reason: string;
  category: 'content' | 'semantic' | 'temporal' | 'behavioral' | 'contextual';
}

export interface ContentAnalysis {
  keywords: string[];
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  complexity: 'simple' | 'moderate' | 'complex';
  readingTime: number;
  language: string;
  entities: Array<{
    text: string;
    type: 'person' | 'organization' | 'location' | 'date' | 'technology';
    confidence: number;
  }>;
}

export interface SmartTaggingOptions {
  enableSemanticAnalysis: boolean;
  enableEntityExtraction: boolean;
  enableTopicModeling: boolean;
  enableSentimentAnalysis: boolean;
  minConfidence: number;
  maxSuggestionsPerFile: number;
  excludeCommonWords: boolean;
  customDictionary: string[];
}

export class AITaggingService {
  private stopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das',
    'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'sob', 'sobre',
    'entre', 'até', 'desde', 'durante', 'antes', 'depois', 'dentro', 'fora',
    'que', 'qual', 'quais', 'quando', 'onde', 'como', 'porque', 'porque', 'por que',
    'é', 'são', 'foi', 'foram', 'ser', 'estar', 'ter', 'haver', 'fazer', 'ir', 'vir',
    'dar', 'ver', 'dizer', 'ficar', 'passar', 'chegar', 'sair', 'voltar', 'viver',
    'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas',
    'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'isso', 'aquilo',
    'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas',
    'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa', 'nossos', 'nossas',
    'muito', 'muita', 'muitos', 'muitas', 'pouco', 'pouca', 'poucos', 'poucas',
    'todo', 'toda', 'todos', 'todas', 'outro', 'outra', 'outros', 'outras',
    'mesmo', 'mesma', 'mesmos', 'mesmas', 'próprio', 'própria', 'próprios', 'próprias'
  ]);

  private commonTechTerms = new Map([
    ['javascript', 'frontend'],
    ['typescript', 'frontend'],
    ['react', 'frontend'],
    ['node', 'backend'],
    ['python', 'backend'],
    ['sql', 'database'],
    ['api', 'backend'],
    ['git', 'development'],
    ['docker', 'devops'],
    ['aws', 'cloud'],
    ['azure', 'cloud'],
    ['kubernetes', 'devops'],
    ['mongodb', 'database'],
    ['postgresql', 'database'],
    ['redis', 'database'],
    ['nginx', 'devops'],
    ['linux', 'devops'],
    ['ubuntu', 'devops'],
    ['webpack', 'frontend'],
    ['babel', 'frontend']
  ]);

  private defaultOptions: SmartTaggingOptions = {
    enableSemanticAnalysis: true,
    enableEntityExtraction: true,
    enableTopicModeling: true,
    enableSentimentAnalysis: true,
    minConfidence: 0.6,
    maxSuggestionsPerFile: 8,
    excludeCommonWords: true,
    customDictionary: []
  };

  constructor(private options: Partial<SmartTaggingOptions> = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  // Analisar conteúdo e sugerir tags
  async suggestTags(content: string, title = '', existingTags: string[] = []): Promise<TagSuggestion[]> {
    const analysis = await this.analyzeContent(content, title);
    const suggestions: TagSuggestion[] = [];

    // 1. Tags baseadas em keywords
    if (analysis.keywords.length > 0) {
      suggestions.push(...this.generateKeywordTags(analysis.keywords));
    }

    // 2. Tags baseadas em entidades
    if (this.options.enableEntityExtraction && analysis.entities.length > 0) {
      suggestions.push(...this.generateEntityTags(analysis.entities));
    }

    // 3. Tags baseadas em tópicos
    if (this.options.enableTopicModeling && analysis.topics.length > 0) {
      suggestions.push(...this.generateTopicTags(analysis.topics));
    }

    // 4. Tags baseadas em sentiment
    if (this.options.enableSentimentAnalysis) {
      suggestions.push(...this.generateSentimentTags(analysis));
    }

    // 5. Tags contextuais baseadas em padrões
    suggestions.push(...this.generateContextualTags(content, title));

    // Filtrar e ranquear sugestões
    return this.rankAndFilterSuggestions(suggestions, existingTags);
  }

  // Sugerir tags para múltiplos arquivos
  async suggestTagsForFiles(files: FileItem[]): Promise<Map<string, TagSuggestion[]>> {
    const results = new Map<string, TagSuggestion[]>();
    
    await Promise.all(
      files.map(async (file) => {
        try {
          const suggestions = await this.suggestTags(
            file.content || '', 
            file.name, 
            file.tags || []
          );
          results.set(file.id, suggestions);
        } catch (error) {
          console.error(`[AI Tagging] Failed to process file ${file.id}:`, error);
          results.set(file.id, []);
        }
      })
    );

    return results;
  }

  // Analisar similaridade entre arquivos
  calculateContentSimilarity(file1: FileItem, file2: FileItem): number {
    const content1 = this.normalizeText(file1.content || '');
    const content2 = this.normalizeText(file2.content || '');
    
    if (!content1 || !content2) return 0;

    // Análise de similaridade baseada em palavras-chave
    const keywords1 = this.extractKeywords(content1);
    const keywords2 = this.extractKeywords(content2);
    
    const intersection = keywords1.filter(k => keywords2.includes(k));
    const union = [...new Set([...keywords1, ...keywords2])];
    
    const keywordSimilarity = intersection.length / union.length;

    // Análise de similaridade baseada em tags existentes
    const tags1 = new Set(file1.tags || []);
    const tags2 = new Set(file2.tags || []);
    const tagIntersection = [...tags1].filter(t => tags2.has(t));
    const tagUnion = [...new Set([...tags1, ...tags2])];
    
    const tagSimilarity = tagUnion.length > 0 ? tagIntersection.length / tagUnion.length : 0;

    // Combinar métricas
    return (keywordSimilarity * 0.7) + (tagSimilarity * 0.3);
  }

  // Sugerir organização baseada em similaridade
  suggestFileOrganization(files: FileItem[]): Array<{
    group: string;
    files: FileItem[];
    tags: string[];
    confidence: number;
  }> {
    const similarities: Array<{
      file1: FileItem;
      file2: FileItem;
      similarity: number;
    }> = [];

    // Calcular similaridades
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const similarity = this.calculateContentSimilarity(files[i], files[j]);
        if (similarity > 0.3) {
          similarities.push({
            file1: files[i],
            file2: files[j],
            similarity
          });
        }
      }
    }

    // Agrupar arquivos similares
    const groups = this.clusterFiles(similarities, files);
    
    return groups.map(group => ({
      group: this.generateGroupName(group),
      files: group,
      tags: this.generateGroupTags(group),
      confidence: this.calculateGroupConfidence(group)
    }));
  }

  // Métodos privados
  private async analyzeContent(content: string, title: string): Promise<ContentAnalysis> {
    const normalizedContent = this.normalizeText(content);
    const keywords = this.extractKeywords(`${normalizedContent  } ${  title}`);
    const entities = this.extractEntities(normalizedContent);
    const topics = this.extractTopics(normalizedContent);
    const sentiment = this.analyzeSentiment(normalizedContent);
    
    return {
      keywords,
      topics,
      sentiment,
      complexity: this.assessComplexity(normalizedContent),
      readingTime: this.calculateReadingTime(normalizedContent),
      language: this.detectLanguage(normalizedContent),
      entities
    };
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, ' ') // Remove pontuação
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }

  private extractKeywords(text: string): string[] {
    const words = text.split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !this.stopWords.has(word) &&
        !/^\d+$/.test(word) // Exclui números puros
      );

    // Contar frequência
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Retornar palavras mais frequentes
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([word]) => word);
  }

  private extractEntities(text: string): ContentAnalysis['entities'] {
    const entities: ContentAnalysis['entities'] = [];
    
    // Padrões simples para extração de entidades
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      url: /https?:\/\/[^\s]+/g,
      date: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      phone: /\b\(\d{2}\)\s?\d{4,5}-?\d{4}\b/g,
      money: /R\$\s?\d+(?:\.\d{3})*(?:,\d{2})?/g
    };

    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            text: match,
            type: type as any,
            confidence: 0.8
          });
        });
      }
    });

    // Detectar tecnologias
    this.commonTechTerms.forEach((category, term) => {
      if (text.includes(term)) {
        entities.push({
          text: term,
          type: 'technology',
          confidence: 0.9
        });
      }
    });

    return entities;
  }

  private extractTopics(text: string): string[] {
    const topicPatterns = new Map([
      ['reunião', ['meeting', 'reuniao', 'encontro', 'agenda']],
      ['projeto', ['projeto', 'project', 'desenvolvimento', 'feature']],
      ['documentação', ['documentacao', 'doc', 'manual', 'guia']],
      ['bug', ['bug', 'erro', 'error', 'problema', 'issue']],
      ['ideia', ['ideia', 'brainstorm', 'conceito', 'proposta']],
      ['planejamento', ['plano', 'planning', 'estrategia', 'roadmap']],
      ['pesquisa', ['pesquisa', 'research', 'estudo', 'analise']],
      ['receita', ['receita', 'ingredientes', 'preparo', 'cozinha']],
      ['viagem', ['viagem', 'travel', 'destino', 'hotel', 'voo']],
      ['financeiro', ['dinheiro', 'orcamento', 'gasto', 'investimento']],
      ['saude', ['saude', 'exercicio', 'dieta', 'medico', 'sintoma']],
      ['educacao', ['curso', 'estudo', 'aula', 'aprender', 'ensino']]
    ]);

    const topics: string[] = [];
    
    topicPatterns.forEach((keywords, topic) => {
      const hasKeywords = keywords.some(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      if (hasKeywords) {
        topics.push(topic);
      }
    });

    return topics;
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = [
      'bom', 'ótimo', 'excelente', 'maravilhoso', 'fantástico', 'perfeito',
      'sucesso', 'conquista', 'vitória', 'alegria', 'feliz', 'satisfeito'
    ];
    
    const negativeWords = [
      'ruim', 'péssimo', 'terrível', 'horrível', 'problema', 'erro',
      'falha', 'frustração', 'triste', 'decepção', 'difícil', 'impossível'
    ];

    const words = text.split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private assessComplexity(text: string): 'simple' | 'moderate' | 'complex' {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/);
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    if (avgWordsPerSentence < 10 && avgWordLength < 5) return 'simple';
    if (avgWordsPerSentence < 20 && avgWordLength < 7) return 'moderate';
    return 'complex';
  }

  private calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private detectLanguage(text: string): string {
    const portugueseIndicators = ['de', 'da', 'do', 'para', 'com', 'que', 'não', 'são', 'uma'];
    const englishIndicators = ['the', 'and', 'for', 'with', 'that', 'not', 'are', 'this'];
    
    const words = text.split(/\s+/).slice(0, 50); // Analisar primeiras 50 palavras
    
    let ptScore = 0;
    let enScore = 0;
    
    words.forEach(word => {
      if (portugueseIndicators.includes(word)) ptScore++;
      if (englishIndicators.includes(word)) enScore++;
    });
    
    return ptScore > enScore ? 'pt-BR' : 'en-US';
  }

  private generateKeywordTags(keywords: string[]): TagSuggestion[] {
    return keywords.slice(0, 5).map(keyword => ({
      tag: keyword,
      confidence: 0.7,
      reason: `Palavra-chave frequente no conteúdo`,
      category: 'content'
    }));
  }

  private generateEntityTags(entities: ContentAnalysis['entities']): TagSuggestion[] {
    return entities.slice(0, 3).map(entity => ({
      tag: entity.text.toLowerCase(),
      confidence: entity.confidence,
      reason: `Entidade ${entity.type} identificada`,
      category: 'semantic'
    }));
  }

  private generateTopicTags(topics: string[]): TagSuggestion[] {
    return topics.map(topic => ({
      tag: topic,
      confidence: 0.8,
      reason: `Tópico identificado no conteúdo`,
      category: 'semantic'
    }));
  }

  private generateSentimentTags(analysis: ContentAnalysis): TagSuggestion[] {
    if (analysis.sentiment === 'neutral') return [];
    
    return [{
      tag: analysis.sentiment,
      confidence: 0.6,
      reason: `Sentimento ${analysis.sentiment} detectado`,
      category: 'contextual'
    }];
  }

  private generateContextualTags(content: string, title: string): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];
    
    // Tags baseadas no título
    if (title.toLowerCase().includes('meeting') || title.toLowerCase().includes('reunião')) {
      suggestions.push({
        tag: 'reunião',
        confidence: 0.9,
        reason: 'Título indica reunião',
        category: 'contextual'
      });
    }

    // Tags baseadas na estrutura do conteúdo
    if (content.includes('TODO') || content.includes('- [ ]')) {
      suggestions.push({
        tag: 'task-list',
        confidence: 0.8,
        reason: 'Contém lista de tarefas',
        category: 'contextual'
      });
    }

    if (content.includes('```') || content.includes('function') || content.includes('const ')) {
      suggestions.push({
        tag: 'código',
        confidence: 0.9,
        reason: 'Contém código',
        category: 'contextual'
      });
    }

    return suggestions;
  }

  private rankAndFilterSuggestions(suggestions: TagSuggestion[], existingTags: string[]): TagSuggestion[] {
    // Filtrar tags já existentes
    const filtered = suggestions.filter(s => 
      !existingTags.includes(s.tag) && 
      s.confidence >= this.options.minConfidence!
    );

    // Remover duplicatas
    const unique = filtered.reduce<TagSuggestion[]>((acc, curr) => {
      const existing = acc.find(s => s.tag === curr.tag);
      if (!existing || curr.confidence > existing.confidence) {
        return [...acc.filter(s => s.tag !== curr.tag), curr];
      }
      return acc;
    }, []);

    // Ordenar por confiança
    return unique
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.options.maxSuggestionsPerFile);
  }

  private clusterFiles(similarities: Array<{ file1: FileItem; file2: FileItem; similarity: number }>, files: FileItem[]): FileItem[][] {
    const groups: FileItem[][] = [];
    const processed = new Set<string>();

    similarities
      .sort((a, b) => b.similarity - a.similarity)
      .forEach(({ file1, file2 }) => {
        if (!processed.has(file1.id) && !processed.has(file2.id)) {
          const group = [file1, file2];
          groups.push(group);
          processed.add(file1.id);
          processed.add(file2.id);
        }
      });

    // Adicionar arquivos isolados
    files.forEach(file => {
      if (!processed.has(file.id)) {
        groups.push([file]);
      }
    });

    return groups;
  }

  private generateGroupName(files: FileItem[]): string {
    if (files.length === 1) return files[0].name;
    
    const commonTags = this.findCommonTags(files);
    if (commonTags.length > 0) {
      return `Grupo: ${commonTags[0]}`;
    }
    
    return `Grupo de ${files.length} arquivos`;
  }

  private generateGroupTags(files: FileItem[]): string[] {
    return this.findCommonTags(files);
  }

  private findCommonTags(files: FileItem[]): string[] {
    if (files.length === 0) return [];
    
    const tagCounts: { [tag: string]: number } = {};
    
    files.forEach(file => {
      (file.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .filter(([, count]) => count >= Math.ceil(files.length / 2))
      .map(([tag]) => tag);
  }

  private calculateGroupConfidence(files: FileItem[]): number {
    if (files.length === 1) return 1.0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        totalSimilarity += this.calculateContentSimilarity(files[i], files[j]);
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }
}

export default AITaggingService; 