'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
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
      setIsLoading(true);
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-sidebar-dark mb-2">Bem-vindo ao GEFI</h1>
        <p className="text-text-light">Insira suas credenciais institucionais para continuar.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">E-mail</label>
          <Input
            type="email"
            placeholder="usuario@ifal.edu.br"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors({ ...errors, email: '' });
              }
            }}
            disabled={isLoading}
            error={errors.email}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">Senha</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors({ ...errors, password: '' });
                }
              }}
              disabled={isLoading}
              error={errors.password}
              className="w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <a href="#" className="text-sm text-text-light hover:text-text-dark underline">
          Esqueci minha senha
        </a>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full h-12 text-base font-semibold">
        {isLoading ? 'Entrando...' : 'ENTRAR'}
      </Button>

      <div className="text-center text-sm text-text-light">
        Não tem uma conta?{' '}
        <a href="/register" className="text-primary hover:underline font-medium">
          Cadastre-se
        </a>
      </div>
    </form>
  );
}