import React from 'react';

interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="text-center text-slate-500 py-8">
      <p>{message}</p>
    </div>
  );
} 