import React, { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CommentReaction } from '@/types/comments';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EmojiPicker } from '@/components/ui/emoji-picker';

interface CommentReactionsProps {
  reactions: CommentReaction[];
  onReactionAdd: (emoji: string) => void;
  onReactionRemove: (reactionId: string) => void;
}

const EMOJI_GROUPS = [
  { name: 'Reações', emojis: ['👍', '❤️', '😂', '😮', '😢', '👏', '🎉', '🔥'] },
  { name: 'Objetos', emojis: ['⭐', '💡', '📌', '🔍', '📝', '📚', '💼', '🎯'] },
  { name: 'Símbolos', emojis: ['✅', '❌', '⚠️', '❓', '❗', '💯', '⚡', '✨'] },
];

export const CommentReactions: React.FC<CommentReactionsProps> = ({
  reactions,
  onReactionAdd,
  onReactionRemove,
}) => {
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);

  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, CommentReaction[]>);

  const handleReactionClick = useCallback((emoji: string) => {
    const userReaction = reactions.find(
      r => r.emoji === emoji && r.userId === user?.id
    );

    if (userReaction) {
      onReactionRemove(userReaction.id);
    } else {
      onReactionAdd(emoji);
    }
  }, [reactions, user, onReactionAdd, onReactionRemove]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    onReactionAdd(emoji);
    setShowPicker(false);
  }, [onReactionAdd]);

  return (
    <div className="flex items-center space-x-2">
      {Object.entries(groupedReactions).map(([emoji, reactions]) => (
        <Button
          key={emoji}
          variant={reactions.some(r => r.userId === user?.id) ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => handleReactionClick(emoji)}
        >
          <span className="mr-1">{emoji}</span>
          <span className="text-sm">{reactions.length}</span>
        </Button>
      ))}

      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
          >
            <span>😀</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <EmojiPicker
            groups={EMOJI_GROUPS}
            onSelect={handleEmojiSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}; 