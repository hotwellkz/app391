import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Trash2, Edit2, Plus } from 'lucide-react';
import { Comment, NewComment, initialCommentState } from '../../types/comment';
import { createComment, updateComment, deleteComment } from '../../services/commentService';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useClientComments } from '../../hooks/useClientComments';
import toast from 'react-hot-toast';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  clientId,
}) => {
  const { comments, loading } = useClientComments(clientId);
  const [formData, setFormData] = useState<NewComment>(initialCommentState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialCommentState);
      setEditingComment(null);
      setIsEditing(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingComment) {
        await updateComment(editingComment.id, formData.text);
        toast.success('Комментарий обновлен');
      } else {
        await createComment(clientId, formData);
        toast.success('Комментарий добавлен');
      }
      setFormData(initialCommentState);
      setEditingComment(null);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving comment:', err);
      setError('Произошла ошибка при сохранении комментария');
      toast.error('Ошибка при сохранении комментария');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingComment(comment);
    setFormData({ text: comment.text });
    setIsEditing(true);
  };

  const handleDelete = async (comment: Comment) => {
    try {
      await deleteComment(comment.id);
      toast.success('Комментарий удален');
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Произошла ошибка при удалении комментария');
      toast.error('Ошибка при удалении комментария');
    }
  };

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

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
          <div className="relative">
            {/* Заголовок */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Комментарии
              </Dialog.Title>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Список комментариев */}
            <div className="px-4 py-3">
              <div className="mb-4 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50">
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                      Загрузка...
                    </div>
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="group relative rounded-lg bg-gray-50 p-3 transition-all hover:bg-gray-100"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {comment.text}
                          </p>
                          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => handleEdit(comment)}
                              className="rounded p-1 text-gray-400 hover:bg-white hover:text-blue-500"
                              title="Редактировать"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(comment)}
                              className="rounded p-1 text-gray-400 hover:bg-white hover:text-red-500"
                              title="Удалить"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    Нет комментариев
                  </div>
                )}
              </div>

              {/* Форма создания/редактирования */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={formData.text}
                      onChange={(e) => setFormData({ text: e.target.value })}
                      className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Введите комментарий..."
                      rows={4}
                      required
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditingComment(null);
                          setFormData(initialCommentState);
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Отменить редактирование
                      </button>
                    )}
                    <div className="flex gap-3 ml-auto">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Сохранение...
                          </>
                        ) : isEditing ? (
                          <>
                            <Edit2 className="h-4 w-4" />
                            Сохранить изменения
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Добавить комментарий
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
