export interface ContentAnalysisResult {
  // Classification
  category: string;
  confidence: number;
  subcategories: string[];
  
  // Content metrics
  readability: {
    score: number;
    level: 'elementary' | 'middle' | 'high' | 'college' | 'graduate';
    avgWordsPerSentence: number;
    avgSyllablesPerWord: number;
  };
  
  // Sentiment analysis
  sentiment: {
    score: number; // -1 to 1
    label: 'negative' | 'neutral' | 'positive';
    confidence: number;
    emotions: {
      joy: number;
      sadness: number;
      anger: number;
      fear: number;
      surprise: number;
      disgust: number;
    };
  };
  
  // Topic extraction
  topics: {
    name: string;
    weight: number;
    keywords: string[];
  }[];
  
  // Language analysis
  language: {
    detected: string;
    confidence: number;
    alternativeLangs: string[];
  };
  
  // Quality metrics
  quality: {
    overall: number;
    grammar: number;
    coherence: number;
    completeness: number;
    originality: number;
  };
  
  // Entity extraction
  entities: {
    type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'other';
    text: string;
    confidence: number;
    position: { start: number; end: number; };
  }[];
  
  // Keywords and phrases
  keywords: {
    word: string;
    frequency: number;
    importance: number;
    category: 'noun' | 'verb' | 'adjective' | 'other';
  }[];
  
  // Content structure
  structure: {
    hasTitle: boolean;
    hasHeadings: boolean;
    hasList: boolean;
    hasLinks: boolean;
    hasImages: boolean;
    paragraphCount: number;
    wordCount: number;
    characterCount: number;
  };
  
  // Recommendations
  suggestions: {
    type: 'improvement' | 'tag' | 'category' | 'related';
    text: string;
    confidence: number;
    actionable: boolean;
  }[];
}

export interface ContentContext {
  documentType: 'note' | 'article' | 'documentation' | 'template' | 'other';
  domain: string;
  author?: string;
  createdAt?: string;
  relatedDocuments?: string[];
}

export class AIContentAnalyzer {
  private categories: Map<string, string[]> = new Map();
  private stopWords: Set<string> = new Set();
  private sentimentLexicon: Map<string, number> = new Map();
  private entityPatterns: RegExp[] = [];
  private initialized = false;

  constructor() {
    this.initializeData();
  }

  private initializeData(): void {
    // Categories and their keywords
    this.categories.set('technology', [
      'software', 'hardware', 'programming', 'code', 'development', 'api', 'database',
      'algorithm', 'artificial intelligence', 'machine learning', 'data science',
      'web development', 'mobile app', 'cloud computing', 'cybersecurity'
    ]);
    
    this.categories.set('business', [
      'strategy', 'marketing', 'sales', 'revenue', 'profit', 'management', 'leadership',
      'finance', 'investment', 'budget', 'analysis', 'planning', 'growth', 'market'
    ]);
    
    this.categories.set('education', [
      'learning', 'study', 'course', 'tutorial', 'lesson', 'education', 'knowledge',
      'teaching', 'training', 'skill', 'certification', 'university', 'research'
    ]);
    
    this.categories.set('health', [
      'medicine', 'healthcare', 'wellness', 'fitness', 'nutrition', 'mental health',
      'exercise', 'diet', 'treatment', 'therapy', 'prevention', 'symptoms'
    ]);
    
    this.categories.set('creative', [
      'design', 'art', 'creative', 'writing', 'content', 'video', 'photography',
      'music', 'visual', 'aesthetic', 'inspiration', 'portfolio', 'creative process'
    ]);

    // Stop words (Portuguese and English)
    this.stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
      'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
      'by', 'from', 'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos',
      'das', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'sobre'
    ]);

    // Basic sentiment lexicon
    this.sentimentLexicon.set('excellent', 0.8);
    this.sentimentLexicon.set('good', 0.6);
    this.sentimentLexicon.set('great', 0.7);
    this.sentimentLexicon.set('amazing', 0.9);
    this.sentimentLexicon.set('wonderful', 0.8);
    this.sentimentLexicon.set('terrible', -0.8);
    this.sentimentLexicon.set('bad', -0.6);
    this.sentimentLexicon.set('awful', -0.9);
    this.sentimentLexicon.set('horrible', -0.8);
    this.sentimentLexicon.set('disappointing', -0.7);
    this.sentimentLexicon.set('love', 0.7);
    this.sentimentLexicon.set('hate', -0.8);
    this.sentimentLexicon.set('like', 0.5);
    this.sentimentLexicon.set('dislike', -0.5);
    this.sentimentLexicon.set('happy', 0.6);
    this.sentimentLexicon.set('sad', -0.6);
    this.sentimentLexicon.set('excited', 0.7);
    this.sentimentLexicon.set('frustrated', -0.6);

    // Entity patterns
    this.entityPatterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Person names
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // Dates
      /\b\$[\d,]+\.?\d*\b/g, // Money
      /\b[A-Z][a-zA-Z\s&]+(?:Inc|Corp|Ltd|LLC)\b/g, // Organizations
    ];

    this.initialized = true;
  }

  async analyzeContent(
    content: string, 
    context: ContentContext = { documentType: 'other', domain: 'general' }
  ): Promise<ContentAnalysisResult> {
    if (!this.initialized) {
      throw new Error('AIContentAnalyzer not initialized');
    }

    console.log('[AIContentAnalyzer] Analyzing content...');
    const startTime = performance.now();

    try {
      // Parallel analysis for better performance
      const [
        category,
        readability,
        sentiment,
        topics,
        language,
        quality,
        entities,
        keywords,
        structure
      ] = await Promise.all([
        this.analyzeCategory(content, context),
        this.analyzeReadability(content),
        this.analyzeSentiment(content),
        this.extractTopics(content),
        this.detectLanguage(content),
        this.analyzeQuality(content, context),
        this.extractEntities(content),
        this.extractKeywords(content),
        this.analyzeStructure(content)
      ]);

      // Generate suggestions
      const suggestions = this.generateSuggestions({
        content,
        category,
        readability,
        sentiment,
        quality,
        structure,
        context
      });

      const endTime = performance.now();
      console.log(`[AIContentAnalyzer] Analysis completed in ${endTime - startTime}ms`);

      return {
        category: category.main,
        confidence: category.confidence,
        subcategories: category.subcategories,
        readability,
        sentiment,
        topics,
        language,
        quality,
        entities,
        keywords,
        structure,
        suggestions
      };
    } catch (error) {
      console.error('[AIContentAnalyzer] Analysis failed:', error);
      throw error;
    }
  }

  private async analyzeCategory(content: string, context: ContentContext): Promise<{
    main: string;
    confidence: number;
    subcategories: string[];
  }> {
    const words = this.tokenize(content);
    const categoryScores = new Map<string, number>();

    // Score each category based on keyword presence
    for (const [category, keywords] of this.categories.entries()) {
      let score = 0;
      let matches = 0;

      for (const keyword of keywords) {
        const keywordWords = keyword.toLowerCase().split(' ');
        const keywordRegex = new RegExp(`\\b${keywordWords.join('\\s+')}\\b`, 'gi');
        const matchCount = (content.toLowerCase().match(keywordRegex) || []).length;
        
        if (matchCount > 0) {
          score += matchCount * (1 + keyword.length / 10); // Longer keywords weighted more
          matches++;
        }
      }

      if (matches > 0) {
        categoryScores.set(category, score / Math.sqrt(words.length)); // Normalize by content length
      }
    }

    // Find best category
    let bestCategory = 'general';
    let bestScore = 0;
    let allCategories: string[] = [];

    for (const [category, score] of categoryScores.entries()) {
      allCategories.push(category);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // Calculate confidence
    const confidence = Math.min(bestScore * 2, 1); // Scale to 0-1

    // Get subcategories (other categories with significant scores)
    const subcategories = allCategories
      .filter(cat => cat !== bestCategory && (categoryScores.get(cat) || 0) > bestScore * 0.3)
      .slice(0, 3);

    return {
      main: bestCategory,
      confidence,
      subcategories
    };
  }

  private async analyzeReadability(content: string): Promise<ContentAnalysisResult['readability']> {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = this.tokenize(content);
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const avgSyllablesPerWord = syllables / Math.max(words.length, 1);

    // Flesch Reading Ease Score
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    const normalizedScore = Math.max(0, Math.min(100, fleschScore)) / 100;

    let level: ContentAnalysisResult['readability']['level'];
    if (fleschScore >= 90) level = 'elementary';
    else if (fleschScore >= 70) level = 'middle';
    else if (fleschScore >= 50) level = 'high';
    else if (fleschScore >= 30) level = 'college';
    else level = 'graduate';

    return {
      score: normalizedScore,
      level,
      avgWordsPerSentence,
      avgSyllablesPerWord
    };
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  private async analyzeSentiment(content: string): Promise<ContentAnalysisResult['sentiment']> {
    const words = this.tokenize(content);
    let totalScore = 0;
    let scoredWords = 0;

    // Basic emotion scores
    const emotions = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0
    };

    for (const word of words) {
      const sentiment = this.sentimentLexicon.get(word.toLowerCase());
      if (sentiment !== undefined) {
        totalScore += sentiment;
        scoredWords++;

        // Simple emotion mapping
        if (sentiment > 0.5) emotions.joy += sentiment;
        else if (sentiment < -0.5) emotions.sadness += Math.abs(sentiment);
      }
    }

    const avgScore = scoredWords > 0 ? totalScore / scoredWords : 0;
    const confidence = Math.min(scoredWords / words.length * 5, 1); // More confidence with more sentiment words

    let label: ContentAnalysisResult['sentiment']['label'];
    if (avgScore > 0.1) label = 'positive';
    else if (avgScore < -0.1) label = 'negative';
    else label = 'neutral';

    // Normalize emotions
    const maxEmotion = Math.max(...Object.values(emotions));
    if (maxEmotion > 0) {
      Object.keys(emotions).forEach(key => {
        emotions[key as keyof typeof emotions] /= maxEmotion;
      });
    }

    return {
      score: avgScore,
      label,
      confidence,
      emotions
    };
  }

  private async extractTopics(content: string): Promise<ContentAnalysisResult['topics']> {
    const words = this.tokenize(content);
    const wordFreq = new Map<string, number>();

    // Count word frequencies
    for (const word of words) {
      if (word.length > 3 && !this.stopWords.has(word.toLowerCase())) {
        wordFreq.set(word.toLowerCase(), (wordFreq.get(word.toLowerCase()) || 0) + 1);
      }
    }

    // Extract topics based on co-occurrence and frequency
    const topics: ContentAnalysisResult['topics'] = [];
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    // Group related words into topics
    for (let i = 0; i < Math.min(5, sortedWords.length); i += 2) {
      const primaryWord = sortedWords[i];
      const relatedWords = sortedWords
        .slice(i + 1, i + 4)
        .map(([word]) => word);

      if (primaryWord) {
        topics.push({
          name: this.capitalizeFirst(primaryWord[0]),
          weight: primaryWord[1] / words.length,
          keywords: [primaryWord[0], ...relatedWords]
        });
      }
    }

    return topics;
  }

  private async detectLanguage(content: string): Promise<ContentAnalysisResult['language']> {
    // Simple language detection based on common words
    const words = this.tokenize(content.substring(0, 500)); // Sample first 500 chars
    
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'];
    const portugueseWords = ['o', 'de', 'e', 'do', 'a', 'em', 'para', 'é', 'com', 'um'];
    const spanishWords = ['el', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no'];

    let englishScore = 0;
    let portugueseScore = 0;
    let spanishScore = 0;

    for (const word of words) {
      const lowerWord = word.toLowerCase();
      if (englishWords.includes(lowerWord)) englishScore++;
      if (portugueseWords.includes(lowerWord)) portugueseScore++;
      if (spanishWords.includes(lowerWord)) spanishScore++;
    }

    const totalMatches = englishScore + portugueseScore + spanishScore;
    const confidence = totalMatches > 0 ? Math.max(englishScore, portugueseScore, spanishScore) / totalMatches : 0.5;

    let detected = 'en';
    const alternativeLangs: string[] = [];

    if (portugueseScore > englishScore && portugueseScore > spanishScore) {
      detected = 'pt';
      if (englishScore > 0) alternativeLangs.push('en');
      if (spanishScore > 0) alternativeLangs.push('es');
    } else if (spanishScore > englishScore && spanishScore > portugueseScore) {
      detected = 'es';
      if (englishScore > 0) alternativeLangs.push('en');
      if (portugueseScore > 0) alternativeLangs.push('pt');
    } else {
      detected = 'en';
      if (portugueseScore > 0) alternativeLangs.push('pt');
      if (spanishScore > 0) alternativeLangs.push('es');
    }

    return {
      detected,
      confidence,
      alternativeLangs
    };
  }

  private async analyzeQuality(content: string, context: ContentContext): Promise<ContentAnalysisResult['quality']> {
    const words = this.tokenize(content);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Grammar score (simplified)
    const grammarErrors = this.detectGrammarIssues(content);
    const grammar = Math.max(0, 1 - grammarErrors / words.length);

    // Coherence score (based on word repetition and structure)
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const coherence = Math.min(uniqueWords / words.length * 2, 1);

    // Completeness score (based on structure and length)
    const hasIntro = sentences.length > 0 && sentences[0].length > 20;
    const hasConclusion = sentences.length > 1 && sentences[sentences.length - 1].length > 15;
    const adequateLength = words.length > 50;
    const completeness = (Number(hasIntro) + Number(hasConclusion) + Number(adequateLength)) / 3;

    // Originality score (simplified - based on common phrase detection)
    const originalityScore = this.calculateOriginality(content);

    const overall = (grammar + coherence + completeness + originalityScore) / 4;

    return {
      overall,
      grammar,
      coherence,
      completeness,
      originality: originalityScore
    };
  }

  private detectGrammarIssues(content: string): number {
    let issues = 0;

    // Simple grammar checks
    if (/\b[a-z]/.test(content.charAt(0))) issues++; // Starts with lowercase
    if (!/[.!?]$/.test(content.trim())) issues++; // Doesn't end with punctuation
    issues += (content.match(/\s{2,}/g) || []).length; // Multiple spaces
    issues += (content.match(/[.!?]{2,}/g) || []).length; // Multiple punctuation

    return issues;
  }

  private calculateOriginality(content: string): number {
    // Check for common clichés and overused phrases
    const commonPhrases = [
      'in conclusion', 'first of all', 'last but not least', 'it goes without saying',
      'needless to say', 'at the end of the day', 'think outside the box'
    ];

    let clicheCount = 0;
    for (const phrase of commonPhrases) {
      if (content.toLowerCase().includes(phrase)) {
        clicheCount++;
      }
    }

    return Math.max(0, 1 - clicheCount * 0.2);
  }

  private async extractEntities(content: string): Promise<ContentAnalysisResult['entities']> {
    const entities: ContentAnalysisResult['entities'] = [];

    for (const pattern of this.entityPatterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex
      
      while ((match = pattern.exec(content)) !== null) {
        let type: ContentAnalysisResult['entities'][0]['type'] = 'other';
        
        if (pattern.source.includes('[A-Z][a-z]+ [A-Z][a-z]+')) type = 'person';
        else if (pattern.source.includes('\\d{1,2}\\/\\d{1,2}\\/\\d{4}')) type = 'date';
        else if (pattern.source.includes('\\$')) type = 'money';
        else if (pattern.source.includes('Inc|Corp|Ltd|LLC')) type = 'organization';

        entities.push({
          type,
          text: match[0],
          confidence: 0.8, // Fixed confidence for pattern-based extraction
          position: {
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    }

    return entities;
  }

  private async extractKeywords(content: string): Promise<ContentAnalysisResult['keywords']> {
    const words = this.tokenize(content);
    const wordFreq = new Map<string, number>();
    const totalWords = words.length;

    // Count frequencies
    for (const word of words) {
      if (word.length > 3 && !this.stopWords.has(word.toLowerCase())) {
        const key = word.toLowerCase();
        wordFreq.set(key, (wordFreq.get(key) || 0) + 1);
      }
    }

    // Calculate importance (TF-IDF like)
    const keywords: ContentAnalysisResult['keywords'] = [];
    
    for (const [word, frequency] of wordFreq.entries()) {
      if (frequency > 1) { // Only include words that appear more than once
        const importance = frequency / totalWords * Math.log(totalWords / frequency);
        
        keywords.push({
          word: this.capitalizeFirst(word),
          frequency,
          importance,
          category: this.classifyWordType(word)
        });
      }
    }

    return keywords
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 20);
  }

  private classifyWordType(word: string): 'noun' | 'verb' | 'adjective' | 'other' {
    // Simple word type classification
    if (word.endsWith('ing') || word.endsWith('ed')) return 'verb';
    if (word.endsWith('ly')) return 'adjective';
    if (word.endsWith('tion') || word.endsWith('sion') || word.endsWith('ment')) return 'noun';
    return 'other';
  }

  private async analyzeStructure(content: string): Promise<ContentAnalysisResult['structure']> {
    const lines = content.split('\n');
    const hasTitle = lines.length > 0 && lines[0].length > 0 && !lines[0].startsWith(' ');
    const hasHeadings = /^#{1,6}\s/.test(content) || /^[A-Z][^.!?]*$/.test(lines.find(l => l.trim().length > 0) || '');
    const hasList = /^\s*[-*+]\s/.test(content) || /^\s*\d+\.\s/.test(content);
    const hasLinks = /https?:\/\/|www\./.test(content);
    const hasImages = /!\[.*?\]\(.*?\)/.test(content) || /<img/.test(content);
    
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const words = this.tokenize(content);

    return {
      hasTitle,
      hasHeadings,
      hasList,
      hasLinks,
      hasImages,
      paragraphCount: paragraphs.length,
      wordCount: words.length,
      characterCount: content.length
    };
  }

  private generateSuggestions(data: any): ContentAnalysisResult['suggestions'] {
    const suggestions: ContentAnalysisResult['suggestions'] = [];

    // Readability suggestions
    if (data.readability.score < 0.5) {
      suggestions.push({
        type: 'improvement',
        text: 'Consider shortening sentences and using simpler words to improve readability',
        confidence: 0.8,
        actionable: true
      });
    }

    // Quality suggestions
    if (data.quality.grammar < 0.7) {
      suggestions.push({
        type: 'improvement',
        text: 'Review for grammar and punctuation errors',
        confidence: 0.9,
        actionable: true
      });
    }

    // Structure suggestions
    if (!data.structure.hasHeadings && data.structure.wordCount > 200) {
      suggestions.push({
        type: 'improvement',
        text: 'Add headings to improve document structure',
        confidence: 0.7,
        actionable: true
      });
    }

    // Category suggestions
    if (data.category.confidence > 0.7) {
      suggestions.push({
        type: 'tag',
        text: `Add '${data.category.main}' tag`,
        confidence: data.category.confidence,
        actionable: true
      });
    }

    return suggestions;
  }

  private tokenize(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Batch analysis for multiple documents
  async analyzeBatch(contents: Array<{ id: string; content: string; context?: ContentContext }>): Promise<Map<string, ContentAnalysisResult>> {
    console.log(`[AIContentAnalyzer] Starting batch analysis of ${contents.length} documents`);
    
    const results = new Map<string, ContentAnalysisResult>();
    const batchSize = 5; // Process in chunks to avoid overwhelming

    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async ({ id, content, context }) => {
          try {
            const result = await this.analyzeContent(content, context);
            return { id, result };
          } catch (error) {
            console.error(`[AIContentAnalyzer] Failed to analyze document ${id}:`, error);
            return null;
          }
        })
      );

      for (const item of batchResults) {
        if (item) {
          results.set(item.id, item.result);
        }
      }

      // Small delay between batches to prevent blocking
      if (i + batchSize < contents.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    console.log(`[AIContentAnalyzer] Batch analysis completed: ${results.size}/${contents.length} successful`);
    return results;
  }
}

// Singleton instance
export const aiContentAnalyzer = new AIContentAnalyzer(); 