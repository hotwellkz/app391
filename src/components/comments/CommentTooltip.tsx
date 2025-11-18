import React from 'react';
import Tippy from '@tippyjs/react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Comment } from '../../types/comment';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';

interface CommentTooltipProps {
  comments: Comment[];
  loading: boolean;
  children: React.ReactNode;
}

export const CommentTooltip: React.FC<CommentTooltipProps> = ({
  comments,
  loading,
  children,
}) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      if (timestamp.toDate) {
        return format(timestamp.toDate(), 'dd MMMM yyyy HH:mm', { locale: ru });
      }
      return '';
    } catch (error) {
      return '';
    }
  };

  const content = (
    <div className="max-w-sm">
      {loading ? (
        <div className="text-center text-gray-500 py-2">Загрузка...</div>
      ) : comments.length > 0 ? (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div 
              key={comment.id} 
              className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-3"
            >
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {comment.text}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-2">
          Нет комментариев
        </div>
      )}
    </div>
  );

  return (
    <Tippy
      content={content}
      interactive={true}
      placement="auto"
      delay={[200, 0]}
      duration={[200, 0]}
      maxWidth={320}
      theme="light"
      className="shadow-lg"
      arrow={true}
      appendTo={() => document.body}
      popperOptions={{
        modifiers: [
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              padding: 8,
              altAxis: true,
            },
          },
          {
            name: 'flip',
            options: {
              padding: 8,
              fallbackPlacements: ['left', 'bottom', 'top'],
            },
          },
        ],
      }}
    >
      {children}
    </Tippy>
  );
};
