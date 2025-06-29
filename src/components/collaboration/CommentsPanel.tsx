
import React from 'react';
import { MessageSquare } from 'lucide-react';

const CommentsPanel: React.FC = () => {
  return (
    <div className="p-4 bg-slate-800 rounded-lg">
      <div className="flex items-center space-x-2 mb-4">
        <MessageSquare className="h-5 w-5 text-blue-400" />
        <h3 className="font-medium text-slate-200">Comentários</h3>
      </div>
      <p className="text-slate-400 text-sm">Nenhum comentário ainda.</p>
    </div>
  );
};

export default CommentsPanel;
