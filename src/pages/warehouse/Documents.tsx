import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, Share2, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ExpenseWaybill } from '../../components/warehouse/ExpenseWaybill';
import { PasswordPrompt } from '../../components/PasswordPrompt';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { Scrollbars } from 'react-custom-scrollbars-2';

interface Document {
  id: string;
  documentNumber: string;
  date: string;
  project: string;
  note: string;
  items: Array<{
    product: {
      name: string;
      unit: string;
    };
    quantity: number;
    price: number;
  }>;
  type: 'expense' | 'income';
}

export const Documents: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showWaybill, setShowWaybill] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'warehouseDocuments'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[];
      
      setDocuments(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredDocuments = documents.filter(doc => {
    if (activeTab === 'all') return true;
    const matchesTab = doc.type === activeTab;
    const matchesSearch = searchQuery === '' || 
      doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.project.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleDeleteClick = (e: React.MouseEvent, document: Document) => {
    e.stopPropagation();
    setDocumentToDelete(document);
    setShowPasswordPrompt(true);
  };

  const handleDelete = async (isAuthenticated: boolean) => {
    if (!isAuthenticated || !documentToDelete) {
      setShowPasswordPrompt(false);
      setDocumentToDelete(null);
      return;
    }

    try {
      await deleteDoc(doc(db, 'warehouseDocuments', documentToDelete.id));
      showSuccessNotification('Документ успешно удален');
    } catch (error) {
      console.error('Error deleting document:', error);
      showErrorNotification('Ошибка при удалении документа');
    } finally {
      setShowPasswordPrompt(false);
      setDocumentToDelete(null);
    }
  };

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
    setShowWaybill(true);
  };

  return (
    <Scrollbars
      style={{ width: '100%', height: '100vh' }}
      universal={true}
      renderThumbVertical={props => <div {...props} className="thumb-vertical" />}
      autoHide
      autoHideTimeout={1000}
      autoHideDuration={200}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center h-16">
              <button onClick={() => navigate('/warehouse')} className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Документы</h1>
                <p className="text-sm text-gray-500">Основной склад</p>
              </div>
            </div>
          </div>
          
          {/* Поиск */}
          <div className="border-t">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по номеру документа или проекту..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Табы */}
          <div className="border-t">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`py-3 px-4 text-sm font-medium border-b-2 ${
                    activeTab === 'all'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setActiveTab('expense')}
                  className={`py-3 px-4 text-sm font-medium border-b-2 ${
                    activeTab === 'expense'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Расходные
                </button>
                <button
                  onClick={() => setActiveTab('income')}
                  className={`py-3 px-4 text-sm font-medium border-b-2 ${
                    activeTab === 'income'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Приходные
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Нет документов</h3>
              <p className="text-gray-500">Документы появятся после создания операций</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleDocumentClick(doc)}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="p-4 sm:p-6 flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        doc.type === 'expense' ? 'bg-red-100' : 'bg-emerald-100'
                      }`}>
                        <FileText className={`w-6 h-6 ${
                          doc.type === 'expense' ? 'text-red-600' : 'text-emerald-600'
                        }`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          {doc.type === 'expense' ? 'Расход' : 'Приход'} №{doc.documentNumber}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle share
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle download
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, doc)}
                            className="p-2 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{doc.project}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-400">{doc.date}</span>
                        <span className="text-xs text-gray-400">
                          {doc.items.length} {doc.items.length === 1 ? 'товар' : 'товаров'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedDocument && (
          <ExpenseWaybill
            isOpen={showWaybill}
            onClose={() => {
              setShowWaybill(false);
              setSelectedDocument(null);
            }}
            data={selectedDocument}
          />
        )}
        
        {showPasswordPrompt && (
          <PasswordPrompt
            isOpen={showPasswordPrompt}
            onClose={() => {
              setShowPasswordPrompt(false);
              setDocumentToDelete(null);
            }}
            onSuccess={() => handleDelete(true)}
          />
        )}
      </div>
    </Scrollbars>
  );
};