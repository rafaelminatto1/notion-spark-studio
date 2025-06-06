
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Block } from '@/types';
import { cn } from '@/lib/utils';
import { Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface CalloutBlockProps {
  block: Block;
  isSelected: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onFocus: () => void;
}

export const CalloutBlock: React.FC<CalloutBlockProps> = ({
  block,
  isSelected,
  onUpdate,
  onFocus
}) => {
  const type = block.properties?.type || 'info';
  
  const getCalloutConfig = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          iconColor: 'text-yellow-500'
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          iconColor: 'text-red-500'
        };
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          iconColor: 'text-green-500'
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          iconColor: 'text-blue-500'
        };
    }
  };

  const config = getCalloutConfig(type);
  const Icon = config.icon;

  return (
    <div className={cn(
      "p-4 rounded-lg border-l-4 flex gap-3",
      config.bgColor,
      config.borderColor,
      isSelected && "ring-1 ring-notion-purple"
    )}>
      <Icon className={cn("h-5 w-5 mt-1 flex-shrink-0", config.iconColor)} />
      <Textarea
        value={block.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        onFocus={onFocus}
        placeholder="Escreva um callout..."
        className="w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-gray-200 min-h-[2rem]"
        rows={1}
      />
    </div>
  );
};
