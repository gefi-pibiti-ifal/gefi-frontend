'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrivateRoute } from '@/components/auth/PrivateRoute';
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm';
import { DocumentList } from '@/components/documents/DocumentList';
import { Document } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Carregar documentos ao montar
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoadingList(true);
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (error) {
      toast.error('Erro ao carregar documentos');
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleUpload = async (title: string, documentType: string, file: File) => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('document_type', documentType);
      formData.append('file', file);

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newDocument: Document = response.data;
      setDocuments((prev) => [newDocument, ...prev]);
      toast.success('Documento enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar documento');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast.success('Documento deletado com sucesso!');
    } catch (error) {
      toast.error('Erro ao deletar documento');
      throw error;
    }
  };

  return (
    <PrivateRoute>
      <DashboardLayout>
        <div className="h-full overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Documentos Normativos</h1>
              <p className="text-gray-600 mt-2">
                Faça upload de documentos para indexação no sistema RAG
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <DocumentUploadForm onUpload={handleUpload} isLoading={isLoading} />
              </div>

              <div className="lg:col-span-2">
                <DocumentList
                  documents={documents}
                  onDelete={handleDelete}
                  isLoading={isLoadingList}
                />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </PrivateRoute>
  );
}
