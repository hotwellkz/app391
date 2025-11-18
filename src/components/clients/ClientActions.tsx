import React, { useState } from 'react';
import { Building2, History, Download, MessageSquare, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client } from '../../types/client';
import { CommentTooltip } from '../comments/CommentTooltip';
import { CommentModal } from '../modals/CommentModal';
import { useClientComments } from '../../hooks/useClientComments';
import { exportToExcel } from '../../services/excelExportService';
import { showErrorNotification } from '../../utils/notifications';
import { Transaction } from '../transactions/types';
import { db } from '../../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where
} from 'firebase/firestore';
import clsx from 'clsx';
import {
  FoundationEstimateData,
  ConsumablesEstimateData
} from '../../types/estimate';
import { exportTransactionsReport } from '../../utils/exportTransactionsReport';

interface EstimateItemData {
  name: string;
  unit?: string;
  quantity?: number;
  price?: number;
  total?: number;
}

interface EstimateSectionData {
  items?: EstimateItemData[];
  totalMaterialsCost?: number;
  totalCost?: number;
  [key: string]: unknown;
}

type FloorEstimateData = EstimateSectionData;
type PartitionEstimateData = EstimateSectionData;
type RoofEstimateData = EstimateSectionData;
type SipWallsEstimateData = EstimateSectionData;

interface ClientActionsProps {
  client: Client;
  size?: 'sm' | 'md';
  className?: string;
  stopPropagation?: boolean;
  allowWrap?: boolean;
}

const iconSizes = {
  sm: {
    button: 'p-0.5',
    icon: 'w-3.5 h-3.5'
  },
  md: {
    button: 'p-1.5',
    icon: 'w-4 h-4'
  }
} as const;

export const ClientActions: React.FC<ClientActionsProps> = ({
  client,
  size = 'md',
  className,
  stopPropagation = false,
  allowWrap = false
}) => {
  const navigate = useNavigate();
  const { comments, loading: commentsLoading } = useClientComments(client.id);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const sizing = iconSizes[size];

  const handleEvent = (event: React.MouseEvent) => {
    if (stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const getClientCategoryId = async () => {
    let categoryId: string | null = null;

    if (client.objectName) {
      const objectNameQuery = query(
        collection(db, 'categories'),
        where('title', '==', client.objectName),
        where('row', '==', 1)
      );
      const objectNameSnapshot = await getDocs(objectNameQuery);

      if (objectNameSnapshot.docs.length === 1) {
        categoryId = objectNameSnapshot.docs[0].id;
      } else if (objectNameSnapshot.docs.length > 1) {
        for (const categoryDoc of objectNameSnapshot.docs) {
          const transactionsQuery = query(
            collection(db, 'transactions'),
            where('categoryId', '==', categoryDoc.id),
            limit(1)
          );
          const transactionsSnapshot = await getDocs(transactionsQuery);

          if (!transactionsSnapshot.empty) {
            const transaction = transactionsSnapshot.docs[0].data() as Transaction;
            const clientName = `${client.lastName} ${client.firstName}`.trim();
            if (
              transaction.toUser?.includes(client.lastName || '') ||
              transaction.toUser?.includes(client.firstName || '') ||
              transaction.description?.includes(client.objectName || '') ||
              transaction.description?.includes(clientName)
            ) {
              categoryId = categoryDoc.id;
              break;
            }
          }
        }

        if (!categoryId) {
          categoryId = objectNameSnapshot.docs[0].id;
        }
      }
    }

    if (!categoryId) {
      const clientName = `${client.lastName} ${client.firstName}`.trim();
      if (clientName) {
        const nameQuery = query(
          collection(db, 'categories'),
          where('title', '==', clientName),
          where('row', '==', 1)
        );
        const nameSnapshot = await getDocs(nameQuery);

        if (nameSnapshot.docs.length === 1) {
          categoryId = nameSnapshot.docs[0].id;
        } else if (nameSnapshot.docs.length > 1) {
          for (const categoryDoc of nameSnapshot.docs) {
            const transactionsQuery = query(
              collection(db, 'transactions'),
              where('categoryId', '==', categoryDoc.id),
              limit(1)
            );
            const transactionsSnapshot = await getDocs(transactionsQuery);

            if (!transactionsSnapshot.empty) {
              const transaction = transactionsSnapshot.docs[0].data() as Transaction;
              if (
                transaction.toUser?.includes(client.lastName || '') ||
                transaction.toUser?.includes(client.firstName || '') ||
                transaction.description?.includes(client.objectName || '')
              ) {
                categoryId = categoryDoc.id;
                break;
              }
            }
          }

          if (!categoryId) {
            categoryId = nameSnapshot.docs[0].id;
          }
        }
      }
    }

    return categoryId;
  };

  const getProjectCategoryId = async () => {
    let categoryId: string | null = null;

    if (client.objectName) {
      const objectNameQuery = query(
        collection(db, 'categories'),
        where('title', '==', client.objectName),
        where('row', '==', 3)
      );
      const objectNameSnapshot = await getDocs(objectNameQuery);

      if (objectNameSnapshot.docs.length === 1) {
        categoryId = objectNameSnapshot.docs[0].id;
      } else if (objectNameSnapshot.docs.length > 1) {
        for (const categoryDoc of objectNameSnapshot.docs) {
          const transactionsQuery = query(
            collection(db, 'transactions'),
            where('categoryId', '==', categoryDoc.id),
            limit(1)
          );
          const transactionsSnapshot = await getDocs(transactionsQuery);

          if (!transactionsSnapshot.empty) {
            const transaction = transactionsSnapshot.docs[0].data() as Transaction;
            const clientName = `${client.lastName} ${client.firstName}`.trim();
            if (
              transaction.toUser?.includes(client.lastName || '') ||
              transaction.toUser?.includes(client.firstName || '') ||
              transaction.description?.includes(client.objectName || '') ||
              transaction.description?.includes(clientName)
            ) {
              categoryId = categoryDoc.id;
              break;
            }
          }
        }

        if (!categoryId) {
          categoryId = objectNameSnapshot.docs[0].id;
        }
      }
    }

    if (!categoryId) {
      const clientName = `${client.lastName} ${client.firstName}`.trim();
      if (clientName) {
        const nameQuery = query(
          collection(db, 'categories'),
          where('title', '==', clientName),
          where('row', '==', 3)
        );
        const nameSnapshot = await getDocs(nameQuery);

        if (nameSnapshot.docs.length === 1) {
          categoryId = nameSnapshot.docs[0].id;
        } else if (nameSnapshot.docs.length > 1) {
          for (const categoryDoc of nameSnapshot.docs) {
            const transactionsQuery = query(
              collection(db, 'transactions'),
              where('categoryId', '==', categoryDoc.id),
              limit(1)
            );
            const transactionsSnapshot = await getDocs(transactionsQuery);

            if (!transactionsSnapshot.empty) {
              const transaction = transactionsSnapshot.docs[0].data() as Transaction;
              if (
                transaction.toUser?.includes(client.lastName || '') ||
                transaction.toUser?.includes(client.firstName || '') ||
                transaction.description?.includes(client.objectName || '')
              ) {
                categoryId = categoryDoc.id;
                break;
              }
            }
          }

          if (!categoryId) {
            categoryId = nameSnapshot.docs[0].id;
          }
        }
      }
    }

    return categoryId;
  };

  const handleProjectHistoryClick = async () => {
    try {
      const categoryId = await getProjectCategoryId();
      if (!categoryId) {
        showErrorNotification('История операций проекта недоступна');
        return;
      }
      navigate(`/transactions/history/${categoryId}`);
    } catch (error) {
      console.error('Error loading project history:', error);
      showErrorNotification('Не удалось загрузить историю операций проекта');
    }
  };

  const handleClientHistoryClick = async () => {
    try {
      const categoryId = await getClientCategoryId();
      if (!categoryId) {
        showErrorNotification('История операций недоступна');
        return;
      }
      navigate(`/transactions/history/${categoryId}`);
    } catch (error) {
      console.error('Error loading history:', error);
      showErrorNotification('Не удалось загрузить историю транзакций');
    }
  };

  const handleExportEstimateClick = async () => {
    try {
      const [
        foundationDoc,
        sipWallsDoc,
        roofDoc,
        partitionDoc,
        consumablesDoc,
        floorDoc
      ] = await Promise.all([
        getDoc(doc(db, 'foundationEstimates', client.id)),
        getDoc(doc(db, 'sipWallsEstimates', client.id)),
        getDoc(doc(db, 'roofEstimates', client.id)),
        getDoc(doc(db, 'partitionEstimates', client.id)),
        getDoc(doc(db, 'consumablesEstimates', client.id)),
        getDoc(doc(db, 'floorEstimates', client.id))
      ]);

      exportToExcel({
        floor: floorDoc.exists() ? (floorDoc.data() as FloorEstimateData) : undefined,
        foundation: foundationDoc.exists() ? (foundationDoc.data() as FoundationEstimateData) : undefined,
        sipWalls: sipWallsDoc.exists() ? (sipWallsDoc.data() as SipWallsEstimateData) : undefined,
        roof: roofDoc.exists() ? (roofDoc.data() as RoofEstimateData) : undefined,
        partition: partitionDoc.exists() ? (partitionDoc.data() as PartitionEstimateData) : undefined,
        consumables: consumablesDoc.exists() ? (consumablesDoc.data() as ConsumablesEstimateData) : undefined
      }, client.objectName || 'Смета');
    } catch (error) {
      console.error('Error exporting estimate:', error);
      showErrorNotification('Не удалось экспортировать смету');
    }
  };

  const handleDownloadReport = async () => {
    try {
      const categoryId = await getClientCategoryId();
      if (!categoryId) {
        showErrorNotification('Нет данных для отчёта');
        return;
      }

      await exportTransactionsReport({
        categoryId,
        categoryTitle: client.objectName || `${client.lastName || ''} ${client.firstName || ''}`.trim(),
        client
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      showErrorNotification('Не удалось скачать отчёт');
    }
  };

  return (
    <>
      <div
        className={clsx(
          'flex items-center gap-1',
          allowWrap ? 'flex-wrap' : 'flex-nowrap',
          className
        )}
      >
        <CommentTooltip comments={comments} loading={commentsLoading}>
          <button
            onClick={(event) => {
              handleEvent(event);
              setShowCommentModal(true);
            }}
            className={clsx(
              'relative rounded hover:bg-gray-100 transition-colors text-gray-500',
              sizing.button
            )}
            title="Комментарии"
          >
            <MessageSquare
              className={clsx(
                sizing.icon,
                comments.length > 0 ? 'comment-icon-active' : 'text-gray-500 hover:text-gray-700'
              )}
            />
          </button>
        </CommentTooltip>

        <button
          onClick={(event) => {
            handleEvent(event);
            handleProjectHistoryClick();
          }}
          className={clsx(
            'text-gray-400 hover:text-gray-600 rounded transition-colors',
            sizing.button
          )}
          title="История транзакций проекта"
        >
          <Building2 className={sizing.icon} />
        </button>

        <button
          onClick={(event) => {
            handleEvent(event);
            handleClientHistoryClick();
          }}
          className={clsx(
            'text-gray-400 hover:text-gray-600 rounded transition-colors',
            sizing.button
          )}
          title="История транзакций клиента"
        >
          <History className={sizing.icon} />
        </button>

        <button
          onClick={(event) => {
            handleEvent(event);
            handleExportEstimateClick();
          }}
          className={clsx(
            'text-gray-400 hover:text-gray-600 rounded transition-colors',
            sizing.button
          )}
          title="Экспорт смет в Excel"
        >
          <Download className={sizing.icon} />
        </button>

        <button
          onClick={(event) => {
            handleEvent(event);
            handleDownloadReport();
          }}
          className={clsx(
            'text-gray-400 hover:text-gray-600 rounded transition-colors',
            sizing.button
          )}
          title="Скачать отчёт по транзакциям"
        >
          <BarChart2 className={sizing.icon} />
        </button>
      </div>

      {showCommentModal && (
        <CommentModal
          isOpen={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          clientId={client.id}
        />
      )}
    </>
  );
};


