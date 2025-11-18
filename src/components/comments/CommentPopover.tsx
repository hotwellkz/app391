import React from 'react';
import { Popover } from '@headlessui/react';
import { Comment } from '../../types/comment';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CommentPopoverProps {
  comments: Comment[];
  onEdit: (comment: Comment) => void;
}

export const CommentPopover: React.FC<CommentPopoverProps> = ({
  comments,
  onEdit,
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
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const renderComments = () => {
    console.log('Rendering comments:', comments);
    
    if (!Array.isArray(comments)) {
      console.warn('Comments is not an array:', comments);
      return null;
    }

    if (comments.length === 0) {
      return (
        <div className="text-sm text-gray-500 text-center py-2">
          Нет комментариев
        </div>
      );
    }

    return comments.map((comment) => {
      console.log('Rendering comment:', comment);
      return (
        <div
          key={comment.id}
          className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
          onClick={() => onEdit(comment)}
        >
          <p className="text-sm text-gray-800 whitespace-pre-wrap">
            {comment.text}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {formatDate(comment.createdAt)}
          </p>
        </div>
      );
    });
  };

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button as="div">{children}</Popover.Button>

          {open && (
            <Popover.Panel
              static
              className="absolute z-10 w-80 p-4 mt-2 -right-2 bg-white rounded-lg shadow-lg border border-gray-200"
            >
              <div className="space-y-3">
                {renderComments()}
              </div>
            </Popover.Panel>
          )}
        </>
      )}
    </Popover>
  );
};
