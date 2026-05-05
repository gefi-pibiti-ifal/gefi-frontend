'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';
import { RegisterPayload } from '@/types';

export function RegisterForm() {
  const { register, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterPayload>({
    full_name: '',
    email: '',
    password: '',
    siap_registration: '',
    user_type: 'fiscal',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    if (!formData.siap_registration) {
      newErrors.siap_registration = 'Matrícula SIAP é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
    }
  };

  const handleInputChange = (field: keyof RegisterPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Cadastro de Fiscal</CardTitle>
        <CardDescription>Crie sua conta para acessar o GeFi Docs</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Seu nome completo"
            value={formData.full_name}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            disabled={isLoading}
            error={errors.full_name}
            label="Nome Completo"
          />

          <Input
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={isLoading}
            error={errors.email}
            label="Email"
          />

          <Input
            type="text"
            placeholder="Sua matrícula SIAP"
            value={formData.siap_registration}
            onChange={(e) => handleInputChange('siap_registration', e.target.value)}
            disabled={isLoading}
            error={errors.siap_registration}
            label="Matrícula SIAP"
          />

          <Select
            value={formData.user_type}
            onChange={(e) =>
              handleInputChange('user_type', e.target.value as RegisterPayload['user_type'])
            }
            disabled={isLoading}
            label="Tipo de Usuário"
            options={[
              { value: 'fiscal', label: 'Fiscal' },
              { value: 'admin', label: 'Administrador' },
              { value: 'viewer', label: 'Visualizador' },
            ]}
          />

          <Input
            type="password"
            placeholder="Sua senha"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            disabled={isLoading}
            error={errors.password}
            label="Senha"
          />

          <Input
            type="password"
            placeholder="Confirme sua senha"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }
            }}
            disabled={isLoading}
            error={errors.confirmPassword}
            label="Confirmar Senha"
          />

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />}
            {isLoading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Já tem conta?{' '}
            <a href="/login" className="text-primary hover:underline font-medium">
              Faça login
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
