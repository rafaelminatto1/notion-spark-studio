
import React from 'react';
import { MessageCircle } from 'lucide-react';

const ChatPanel: React.FC = () => {
  return (
    <div className="p-4 bg-slate-800 rounded-lg">
      <div className="flex items-center space-x-2 mb-4">
        <MessageCircle className="h-5 w-5 text-emerald-400" />
        <h3 className="font-medium text-slate-200">Chat</h3>
      </div>
      <p className="text-slate-400 text-sm">Chat disponível em breve.</p>
    </div>
  );
};

export default ChatPanel;
