import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useUsers } from '@/hooks/useUsers';
import type { CommentMention } from '@/types/comments';
import { Avatar } from '@/components/ui/avatar';
import { Command } from '@/components/ui/command';

interface MentionsSystemProps {
  value: string;
  onChange: (value: string, mentions: CommentMention[]) => void;
  placeholder?: string;
  className?: string;
}

export const MentionsSystem: React.FC<MentionsSystemProps> = ({
  value,
  onChange,
  placeholder = 'Digite @ para mencionar alguém...',
  className = '',
}) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionsListRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(mentionSearch, 300);
  const { users, loading: loadingUsers } = useUsers(debouncedSearch);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const rect = e.target.getBoundingClientRect();
      const lineHeight = parseInt(getComputedStyle(e.target).lineHeight);
      const lines = textBeforeCursor.split('\n').length;
      
      setMentionPosition({
        top: rect.top + (lines * lineHeight),
        left: rect.left + (mentionMatch[0].length * 8), // Aproximação da largura do caractere
      });
      
      setMentionSearch(mentionMatch[1]);
      setShowMentions(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
    }

    // Extrair menções existentes
    const mentions: CommentMention[] = [];
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = mentionRegex.exec(newValue)) !== null) {
      mentions.push({
        id: crypto.randomUUID(),
        userId: match[2],
        userName: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        createdAt: new Date(),
      });
    }

    onChange(newValue, mentions);
  }, [onChange]);

  const handleMentionSelect = useCallback((user: { id: string; name: string; avatar?: string }) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const newText = `${textBeforeCursor.slice(0, -mentionMatch[0].length) 
        }@[${user.name}](${user.id})${ 
        textAfterCursor}`;

      onChange(newText, []);
      setShowMentions(false);
    }
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showMentions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        prev < users.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedUser = users[selectedMentionIndex];
      if (selectedUser) {
        handleMentionSelect(selectedUser);
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  }, [showMentions, users, selectedMentionIndex, handleMentionSelect]);

  useEffect(() => {
    if (mentionsListRef.current && showMentions) {
      const selectedElement = mentionsListRef.current.children[selectedMentionIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedMentionIndex, showMentions]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full min-h-[100px] p-2 border rounded-md ${className}`}
      />

      {showMentions && (
        <div
          ref={mentionsListRef}
          className="absolute z-50 w-64 max-h-48 overflow-y-auto bg-white border rounded-md shadow-lg"
          style={{
            top: `${mentionPosition.top}px`,
            left: `${mentionPosition.left}px`,
          }}
        >
          {loadingUsers ? (
            <div className="p-2 text-sm text-gray-500">Carregando...</div>
          ) : users.length === 0 ? (
            <div className="p-2 text-sm text-gray-500">Nenhum usuário encontrado</div>
          ) : (
            users.map((user, index) => (
              <div
                key={user.id}
                className={`p-2 flex items-center space-x-2 cursor-pointer hover:bg-gray-100 ${
                  index === selectedMentionIndex ? 'bg-gray-100' : ''
                }`}
                onClick={() => { handleMentionSelect(user); }}
              >
                <Avatar src={user.avatar} alt={user.name} size="sm" />
                <span className="text-sm">{user.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}; 