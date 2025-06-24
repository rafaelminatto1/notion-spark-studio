import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function Button({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded bg-slate-800 text-white font-semibold hover:bg-slate-700 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
