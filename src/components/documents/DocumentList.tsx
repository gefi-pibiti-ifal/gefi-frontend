'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Document } from '@/types';
import { FileText, Trash2, Loader2 } from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function DocumentList({ documents, onDelete, isLoading = false }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
            <p className="text-gray-600">Nenhum documento enviado ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos Enviados</CardTitle>
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
                  <div className="flex gap-2 text-xs text-gray-600">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                      {doc.document_type}
                    </span>
                    <span>
                      {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading || deletingId === doc.id}
                  onClick={() => handleDelete(doc.id)}
                  className="ml-2"
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
