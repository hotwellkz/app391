import React, { useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Eye } from 'lucide-react';

interface TemplateEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  previewData?: Record<string, string>;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  content,
  onChange,
  placeholder = 'Начните вводить текст...',
  previewData = {}
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const getPreviewContent = () => {
    let previewContent = content;
    Object.entries(previewData).forEach(([key, value]) => {
      previewContent = previewContent.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return previewContent;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">
          {showPreview ? 'Предпросмотр' : 'Редактирование'}
        </h3>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <Eye className="w-4 h-4 mr-1" />
          {showPreview ? 'Редактировать' : 'Предпросмотр'}
        </button>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {showPreview ? (
          <div 
            className="p-4 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
          />
        ) : (
          <Editor
            apiKey="54c7l7sk0h27kwwt3hyb2prfrv1iwdi3wzibo1ajqij22clf"
            value={content}
            onEditorChange={onChange}
            init={{
              height: 500,
              menubar: false,
              language: 'ru',
              language_url: 'https://cdn.jsdelivr.net/npm/tinymce-lang/langs/ru.js',
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic backcolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
              placeholder: placeholder,
              table_default_styles: {
                'border-collapse': 'collapse',
                'width': '100%',
                'border': '1px solid #ccc'
              },
              table_class_list: [
                {title: 'Нет', value: ''},
                {title: 'Таблица 1', value: 'table1'},
                {title: 'Таблица 2', value: 'table2'}
              ],
              table_cell_class_list: [
                {title: 'Нет', value: ''},
                {title: 'Заголовок', value: 'header'},
                {title: 'Данные', value: 'data'}
              ],
              table_row_class_list: [
                {title: 'Нет', value: ''},
                {title: 'Заголовок', value: 'header'},
                {title: 'Данные', value: 'data'}
              ],
              images_upload_url: 'https://api.tiny.cloud/1/54c7l7sk0h27kwwt3hyb2prfrv1iwdi3wzibo1ajqij22clf/upload',
              images_upload_handler: function (blobInfo, success, failure) {
                const xhr = new XMLHttpRequest();
                xhr.withCredentials = false;
                xhr.open('POST', 'https://api.tiny.cloud/1/54c7l7sk0h27kwwt3hyb2prfrv1iwdi3wzibo1ajqij22clf/upload');
                xhr.onload = function() {
                  if (xhr.status !== 200) {
                    failure('Ошибка загрузки изображения: ' + xhr.status);
                    return;
                  }
                  const json = JSON.parse(xhr.responseText);
                  if (!json || typeof json.location != 'string') {
                    failure('Неверный ответ сервера: ' + xhr.responseText);
                    return;
                  }
                  success(json.location);
                };
                const formData = new FormData();
                formData.append('file', blobInfo.blob(), blobInfo.filename());
                xhr.send(formData);
              }
            }}
          />
        )}
      </div>

      {!showPreview && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Доступные плейсхолдеры:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(previewData).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <code className="bg-gray-200 px-2 py-1 rounded mr-2">{`{${key}}`}</code>
                <span className="text-gray-600">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 