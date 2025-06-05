
import { useState, useCallback, useRef, useEffect } from 'react';

export interface LinkSuggestion {
  id: string;
  name: string;
  exists: boolean;
  content?: string;
}

interface UseLinkAutocompleteProps {
  files: any[];
  onCreateFile?: (name: string) => Promise<string>;
  onNavigateToFile?: (fileName: string) => void;
}

export const useLinkAutocomplete = ({
  files,
  onCreateFile,
  onNavigateToFile
}: UseLinkAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentQuery, setCurrentQuery] = useState('');
  const [linkStart, setLinkStart] = useState(0);
  const triggerRef = useRef<{ content: string; cursorPos: number } | null>(null);

  const findLinkQuery = useCallback((content: string, cursorPos: number) => {
    // Find if cursor is inside [[ ]] link syntax
    const beforeCursor = content.substring(0, cursorPos);
    const afterCursor = content.substring(cursorPos);
    
    // Look for [[ before cursor
    const linkStartMatch = beforeCursor.match(/\[\[([^\]]*?)$/);
    if (!linkStartMatch) return null;
    
    // Look for ]] after cursor
    const linkEndMatch = afterCursor.match(/^([^\]]*?)\]\]/);
    const partialQuery = linkStartMatch[1];
    
    return {
      query: partialQuery,
      start: cursorPos - partialQuery.length,
      isComplete: !!linkEndMatch
    };
  }, []);

  const generateSuggestions = useCallback((query: string): LinkSuggestion[] => {
    const normalizedQuery = query.toLowerCase();
    
    // Get existing files that match
    const existingFiles = files
      .filter(file => 
        file.name.toLowerCase().includes(normalizedQuery) ||
        (file.content && file.content.toLowerCase().includes(normalizedQuery))
      )
      .slice(0, 5)
      .map(file => ({
        id: file.id,
        name: file.name,
        exists: true,
        content: file.content?.substring(0, 100)
      }));

    // Add option to create new file if query doesn't match exactly
    const exactMatch = files.some(file => 
      file.name.toLowerCase() === normalizedQuery
    );

    const suggestions: LinkSuggestion[] = [...existingFiles];
    
    if (query.length > 0 && !exactMatch) {
      suggestions.push({
        id: `create-${query}`,
        name: query,
        exists: false
      });
    }

    return suggestions;
  }, [files]);

  const handleTextChange = useCallback((content: string, cursorPos: number) => {
    triggerRef.current = { content, cursorPos };
    
    const linkInfo = findLinkQuery(content, cursorPos);
    
    if (linkInfo && !linkInfo.isComplete) {
      const newSuggestions = generateSuggestions(linkInfo.query);
      setSuggestions(newSuggestions);
      setCurrentQuery(linkInfo.query);
      setLinkStart(linkInfo.start);
      setSelectedIndex(0);
      setIsOpen(newSuggestions.length > 0);
      
      // Calculate position (simplified - would need more complex logic for real positioning)
      setPosition({ x: 100, y: 100 });
    } else {
      setIsOpen(false);
      setSuggestions([]);
    }
  }, [findLinkQuery, generateSuggestions]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent): boolean => {
    if (!isOpen || suggestions.length === 0) return false;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        return true;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? suggestions.length - 1 : prev - 1);
        return true;
        
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        return true;
        
      case 'Escape':
        e.preventDefault();
        closeSuggestions();
        return true;
        
      default:
        return false;
    }
  }, [isOpen, suggestions, selectedIndex]);

  const selectSuggestion = useCallback(async (suggestion: LinkSuggestion) => {
    if (!triggerRef.current) return;

    const { content, cursorPos } = triggerRef.current;
    
    if (suggestion.exists) {
      // Navigate to existing file
      if (onNavigateToFile) {
        onNavigateToFile(suggestion.name);
      }
    } else {
      // Create new file
      if (onCreateFile) {
        await onCreateFile(suggestion.name);
        if (onNavigateToFile) {
          onNavigateToFile(suggestion.name);
        }
      }
    }
    
    closeSuggestions();
  }, [onCreateFile, onNavigateToFile]);

  const closeSuggestions = useCallback(() => {
    setIsOpen(false);
    setSuggestions([]);
    setCurrentQuery('');
    setSelectedIndex(0);
  }, []);

  return {
    isOpen,
    suggestions,
    position,
    selectedIndex,
    handleTextChange,
    handleKeyDown,
    selectSuggestion,
    closeSuggestions
  };
};
