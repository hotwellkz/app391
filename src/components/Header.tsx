import React from 'react';
import { StickyNavigation } from './StickyNavigation';

interface HeaderProps {
  stats: Array<{ label: string; value: string; }>;
  onPageChange: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onPageChange }) => {
  return <StickyNavigation onNavigate={onPageChange} />;
};