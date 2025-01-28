import React, { useState } from 'react';

export const useLayoutMode = () => {
  const [layoutMode, setLayoutMode] = useState<'default' | 'reversed'>('default');

  const toggleLayoutMode = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setLayoutMode(prev => prev === 'default' ? 'reversed' : 'default');
  };

  return { layoutMode, toggleLayoutMode };
};