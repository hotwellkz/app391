import React from 'react';
import { ArrowLeft, FileText, Pencil, FileSignature, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
  title: string;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  clientId: string;
  onSave?: () => Promise<void>;
  onBack?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  isEditing,
  setIsEditing,
  clientId,
  onSave,
  onBack
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      // Fallback: если onBack не передан, используем navigate
      navigate('/clients');
    }
  };

  const handleEditClick = async () => {
    if (isEditing && onSave) {
      await onSave();
    } else {
      setIsEditing(!isEditing);
    }
  };

  return (
    <div className="fixed top-0 left-0 md:left-64 right-0 z-50 bg-white/80 backdrop-blur-sm border-b shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackClick}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Назад"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-2xl font-medium truncate">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              to={`/clients/${clientId}/files`}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Файлы"
            >
              <FileText className="w-5 h-5" />
            </Link>
            <button
              onClick={handleEditClick}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title={isEditing ? "Сохранить" : "Редактировать"}
            >
              {isEditing ? (
                <Save className="w-5 h-5" />
              ) : (
                <Pencil className="w-5 h-5" />
              )}
            </button>
            <Link
              to={`/create-contract/${clientId}`}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Создать договор"
            >
              <FileSignature className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
