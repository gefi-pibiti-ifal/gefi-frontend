'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, FileText } from 'lucide-react';
import { DocumentType } from '@/types';

interface DocumentUploadFormProps {
  onUpload: (title: string, documentType: string, file: File) => Promise<void>;
  isLoading?: boolean;
}

const DOCUMENT_TYPES = [
  { value: DocumentType.NORMATIVO, label: 'Normativo' },
  { value: DocumentType.REGULAMENTO, label: 'Regulamento' },
  { value: DocumentType.RESOLUCAO, label: 'Resolução' },
  { value: DocumentType.INSTRUCAO, label: 'Instrução' },
  { value: DocumentType.OUTRO, label: 'Outro' },
];

export function DocumentUploadForm({ onUpload, isLoading = false }: DocumentUploadFormProps) {
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.NORMATIVO);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!file) {
      newErrors.file = 'Arquivo é obrigatório';
    } else if (file.type !== 'application/pdf') {
      newErrors.file = 'Apenas arquivos PDF são aceitos';
    } else if (file.size > 10 * 1024 * 1024) {
      newErrors.file = 'Arquivo não pode ser maior que 10MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (errors.file) {
        setErrors({ ...errors, file: '' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onUpload(title, documentType, file!);
      setTitle('');
      setDocumentType(DocumentType.NORMATIVO);
      setFile(null);
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload de Documento</CardTitle>
        <CardDescription>Envie documentos normativos para indexação no RAG</CardDescription>
      </CardHeader>
      <CardContent >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Ex: Resolução de Conformidade 2024"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) {
                setErrors({ ...errors, title: '' });
              }
            }}
            disabled={isLoading}
            error={errors.title}
            label="Título do Documento"
          />

          <Select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            disabled={isLoading}
            label="Tipo de Documento"
            options={DOCUMENT_TYPES}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arquivo PDF
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                errors.file ? 'border-red-500' : 'border-gray-300 hover:border-primary'
              }`}
            >
              <input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isLoading}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">
                  {file ? file.name : 'Clique para selecionar ou arraste um arquivo'}
                </p>
                <p className="text-xs text-gray-600 mt-1">PDF até 10MB</p>
              </label>
            </div>
            {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />}
            {isLoading ? 'Enviando...' : 'Enviar Documento'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
