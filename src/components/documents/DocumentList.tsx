'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Document } from '@/types';
import { Download, FileText, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api';
import { documentFilePath, downloadDocumentFile, repairFileName } from '@/lib/documents';
import { formatFileSize } from '@/lib/sources';

interface DocumentListProps {
  documents: Document[];
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function DocumentList({ documents, onDelete, isLoading = false }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;

    try {
      setDeletingId(id);
      await onDelete(id);
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      setDownloadingId(doc.id);
      await downloadDocumentFile(
        documentFilePath(doc.id, true),
        doc.file_name ?? `${doc.title}.pdf`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloadingId(null);
    }
  };

  if (documents.length === 0 && !isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 w-full">
            <img src="/empty-docs.svg" alt="Nenhum documento encontrado" className="w-166 h-110" />
            <p className="text-gray-600">Nenhum documento encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Base de Conhecimento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                  <div className="flex gap-2 items-center text-xs text-gray-600">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                      {doc.document_type}
                    </span>
                    <span>
                      {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {doc.file_name && (
                      <span className="truncate" title={repairFileName(doc.file_name)}>
                        {[
                          repairFileName(doc.file_name),
                          formatFileSize(doc.file_size),
                          doc.total_pages ? `${doc.total_pages} páginas` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 ml-2 shrink-0">
                {/* Documentos indexados antes da preservação do arquivo não têm
                    binário para baixar — a ação simplesmente não aparece. */}
                {doc.file_name && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={downloadingId === doc.id}
                    onClick={() => handleDownload(doc)}
                    title="Baixar o documento original"
                    aria-label={`Baixar ${doc.title}`}
                  >
                    {downloadingId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                )}

                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoading || deletingId === doc.id}
                    onClick={() => handleDelete(doc.id)}
                    title="Remover documento"
                    aria-label={`Remover ${doc.title}`}
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
