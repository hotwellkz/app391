import React from 'react';
import { Client } from '../../types/client';

interface ConstructionProgressProps {
  client: Client;
}

export const ConstructionProgress: React.FC<ConstructionProgressProps> = ({ client }) => {
  const calculateProgress = () => {
    if (!client.createdAt) return 0;
    if (!client.constructionDays || client.constructionDays === 0) return 100;
    
    const startDate = client.createdAt.toDate();
    const currentDate = new Date();
    const totalDays = client.constructionDays + 15; // Добавляем 15 дней к сроку строительства
    const deadlineDate = new Date(startDate);
    deadlineDate.setDate(deadlineDate.getDate() + totalDays);

    // Вычисляем прогресс в процентах
    const totalDuration = totalDays * 24 * 60 * 60 * 1000; // в миллисекундах
    const elapsed = currentDate.getTime() - startDate.getTime();
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    return Math.round(progress);
  };

  const progress = calculateProgress();
  const isOverdue = progress > 100;

  const getProgressColor = () => {
    if (!client.constructionDays || client.constructionDays === 0) return 'bg-emerald-400';
    if (isOverdue) return 'bg-red-400';
    if (progress >= 70) return 'bg-emerald-400';
    if (progress >= 30) return 'bg-emerald-500';
    return 'bg-emerald-600';
  };

  const getTextColor = () => {
    if (!client.constructionDays || client.constructionDays === 0) return 'text-emerald-500';
    if (isOverdue) return 'text-red-500';
    if (progress >= 70) return 'text-emerald-500';
    if (progress >= 30) return 'text-emerald-600';
    return 'text-emerald-700';
  };

  const getRemainingDays = () => {
    if (!client.createdAt || !client.constructionDays) return 0;
    
    const startDate = client.createdAt.toDate();
    const currentDate = new Date();
    const totalDays = client.constructionDays + 15;
    const deadlineDate = new Date(startDate);
    deadlineDate.setDate(deadlineDate.getDate() + totalDays);

    const remaining = Math.ceil((deadlineDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  };

  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <div className="w-full h-1.5 bg-gray-100 rounded-full">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className={`font-medium ${getTextColor()}`}>
          {progress}%
        </span>
        <span className="text-gray-500">
          {isOverdue ? 'Просрочено' : `${getRemainingDays()} дн.`}
        </span>
      </div>
    </div>
  );
};
