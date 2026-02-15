'use client';

import React, { useEffect, useState } from 'react';
import { documentsApi } from '@/lib/api';
import { Document } from '@/lib/types';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Pin, 
  Tag,
  Calendar,
  User
} from 'lucide-react';

interface DocumentsListProps {
  projectId?: string;
  taskId?: string;
  showCreateButton?: boolean;
}

export function DocumentsList({ projectId, taskId, showCreateButton = true }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [projectId, taskId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (projectId) filters.projectId = projectId;
      if (taskId) filters.taskId = taskId;
      
      const data = await documentsApi.getAll(filters);
      setDocuments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
        Erro ao carregar documentos: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Documentos ({documents.length})
        </h3>
        {showCreateButton && (
          <Link
            href={`/documents/new${projectId ? `?projectId=${projectId}` : ''}${taskId ? `?taskId=${taskId}` : ''}`}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Novo
          </Link>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 text-sm">
            Nenhum documento encontrado
          </p>
          {showCreateButton && (
            <Link
              href={`/documents/new${projectId ? `?projectId=${projectId}` : ''}${taskId ? `?taskId=${taskId}` : ''}`}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 mt-3"
            >
              <Plus className="w-4 h-4 mr-1" />
              Criar Primeiro Documento
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center flex-1">
                  <FileText className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                  <h4 className="font-medium text-gray-900 hover:text-blue-600">
                    {doc.title}
                  </h4>
                  {doc.isPinned && (
                    <Pin className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-2 flex-shrink-0" />
                  )}
                </div>
              </div>

              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {doc.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                  {doc.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{doc.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {doc.author.name}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(doc.createdAt)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
