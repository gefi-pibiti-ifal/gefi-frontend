'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrivateRoute } from '@/components/auth/PrivateRoute';
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm';
import { DocumentList } from '@/components/documents/DocumentList';
import { Document } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;
  
  const isReadOnly = user?.user_type !== 'ADMINISTRADOR';

  const loadDocuments = async (page: number, search: string) => {
    try {
      setIsLoadingList(true);    
      const response = await api.get('/documents', {
        params: {
          page,
          limit: itemsPerPage,
          title: search
        }
      });          
      setDocuments(response.data.data); 
      setTotalPages(response.data.meta.totalPages);
    } catch (error) {
      toast.error('Erro ao carregar documentos');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadDocuments(currentPage, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchTerm]);

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
          <div className="max-w-5xl mx-auto w-full space-y-8">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">Documentos Normativos</h1>
                {!isReadOnly && (
                  <p className="text-gray-600 mt-2">
                    Faça upload de documentos para indexação no sistema RAG
                  </p>
                )}
              </div>

              <div className="relative w-full md:max-w-md shrink-0">
                <Input
                  placeholder="Pesquisar por título de documento normativo..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-12 h-12 text-base shadow-sm w-full"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>          
            </div>
            
            <div className={isReadOnly ? "w-full" : "grid grid-cols-1 lg:grid-cols-3 gap-8"}>
              
              {!isReadOnly && (
                <div className="lg:col-span-1">
                  <DocumentUploadForm onUpload={handleUpload} isLoading={isLoading} />
                </div>
              )}

              <div className={isReadOnly ? "w-full space-y-4" : "lg:col-span-2 space-y-4"}>
                <DocumentList
                  documents={documents}
                  onDelete={!isReadOnly ? handleDelete : undefined}
                  isLoading={isLoadingList}
                />
                            
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      disabled={currentPage === 1 || isLoadingList}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="px-5 py-2.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Anterior
                    </button>
                    <span className="flex items-center px-6 text-sm text-gray-600 font-semibold bg-gray-100 rounded-lg">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages || isLoadingList}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="px-5 py-2.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </div>
            </div>
          
          </div>
        </div>
      </DashboardLayout>
    </PrivateRoute>
  );
}