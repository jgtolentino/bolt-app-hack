import React from 'react';

interface EmptyStateProps {
  msg?: string;
}

export default function EmptyState({ msg = 'No data available' }: EmptyStateProps) {
  return (
    <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
      {msg}
    </div>
  );
}