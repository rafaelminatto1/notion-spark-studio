import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface EmojiGroup {
  name: string;
  emojis: string[];
}

interface EmojiPickerProps {
  groups: EmojiGroup[];
  onSelect: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  groups,
  onSelect,
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(groups[0]?.name);

  const filteredGroups = groups.map(group => ({
    ...group,
    emojis: group.emojis.filter(emoji =>
      emoji.toLowerCase().includes(search.toLowerCase())
    ),
  }));

  return (
    <div className="w-full">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
          {filteredGroups.map(group => (
            <TabsTrigger
              key={group.name}
              value={group.name}
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
            >
              {group.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {filteredGroups.map(group => (
          <TabsContent key={group.name} value={group.name} className="mt-0">
            <ScrollArea className="h-[200px]">
              <div className="grid grid-cols-8 gap-1 p-2">
                {group.emojis.map(emoji => (
                  <button
                    key={emoji}
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                    onClick={() => onSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}; 