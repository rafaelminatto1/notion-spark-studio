import { useEffect, useCallback, RefObject, useState } from 'react';

interface UseAutoResizeOptions {
  minHeight?: number;
  maxHeight?: number;
  lineHeight?: number;
  padding?: number;
}

export function useAutoResize(
  textareaRef: RefObject<HTMLTextAreaElement>,
  content: string,
  options: UseAutoResizeOptions = {}
) {
  const {
    minHeight = 120,
    maxHeight = window.innerHeight * 0.7,
    lineHeight = 24,
    padding = 16
  } = options;

  const [isResizing, setIsResizing] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(minHeight);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    setIsResizing(true);

    // Reset height to calculate new scrollHeight
    textarea.style.height = 'auto';

    // Calculate content height
    const contentHeight = textarea.scrollHeight;
    
    // Calculate line count
    const lines = content.split('\n').length;
    const calculatedHeight = Math.max(
      minHeight,
      Math.min(maxHeight, contentHeight + padding)
    );

    // Set the new height
    textarea.style.height = calculatedHeight + 'px';
    setCurrentHeight(calculatedHeight);

    // Update CSS custom properties for styling
    textarea.style.setProperty('--line-count', lines.toString());
    textarea.style.setProperty('--content-height', contentHeight + 'px');

    // Reset resizing state after a short delay
    setTimeout(() => setIsResizing(false), 150);

  }, [content, minHeight, maxHeight, lineHeight, padding]);

  // Adjust height when content changes
  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => {
      // Update maxHeight based on new window size
      const newMaxHeight = window.innerHeight * 0.7;
      const textarea = textareaRef.current;
      if (textarea) {
        const currentHeight = parseInt(textarea.style.height);
        if (currentHeight > newMaxHeight) {
          textarea.style.height = newMaxHeight + 'px';
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { 
    adjustHeight, 
    isResizing, 
    currentHeight, 
    minHeight, 
    maxHeight 
  };
} 