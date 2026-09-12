'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { PrivateRoute } from '@/components/auth/PrivateRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

const CARGOS: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  FISCAL: 'Fiscal',
};

/**
 * Primeiro acesso: a pessoa completa o que o Google não fornece.
 *
 * E-mail e cargo aparecem apenas para leitura -- vieram do convite e da conta
 * Google. Não é decoração: deixá-los editáveis recriaria a falha do cadastro
 * antigo, em que a própria pessoa escolhia ser ADMINISTRADOR. O backend recusa
 * esses campos de qualquer forma (400), mas a tela não deve sequer sugerir que
 * são negociáveis.
 */
function CompleteProfileForm() {
  const router = useRouter();
  const { user, completeProfile } = useAuth();

  // `null` = a pessoa ainda não digitou nada, então vale o nome vindo do
  // Google. Derivar assim, em vez de sincronizar com um efeito, evita um
  // setState durante o render inicial -- e evita sobrescrever o que ela digitou
  // caso /auth/me responda depois.
  const [nomeDigitado, setNomeDigitado] = useState<string | null>(null);
  const fullName = nomeDigitado ?? user?.full_name ?? '';

  const [siap, setSiap] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quem já completou o perfil não tem o que fazer aqui.
  useEffect(() => {
    if (user?.profile_completed) router.replace('/dashboard');
  }, [user?.profile_completed, router]);

  const validar = () => {
    const novos: Record<string, string> = {};

    if (!fullName.trim()) {
      novos.full_name = 'Nome completo é obrigatório';
    } else if (fullName.trim().length < 3) {
      novos.full_name = 'Nome completo deve ter ao menos 3 caracteres';
    }

    // Mesma regra do CompleteProfileDto no backend.
    if (!siap.trim()) {
      novos.siap_registration = 'Matrícula SIAP é obrigatória';
    } else if (!/^[0-9]{4,20}$/.test(siap.trim())) {
      novos.siap_registration = 'A matrícula deve conter de 4 a 20 dígitos';
    }

    setErrors(novos);
    return Object.keys(novos).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;

    try {
      setIsSubmitting(true);
      await completeProfile({
        full_name: fullName.trim(),
        siap_registration: siap.trim(),
      });
      router.replace('/dashboard');
    } catch {
      // O toast do contexto já informou; manter a pessoa no formulário.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border-light bg-white p-8 shadow-sm">
        <div className="mb-6">
          <div className="mb-4 text-2xl font-bold">
            <span className="text-sidebar-dark">GE</span>
            <span className="text-primary">FI</span>
          </div>
          <h1 className="mb-1 text-xl font-semibold text-text-dark">Complete seu cadastro</h1>
          <p className="text-sm text-text-light">
            Faltam dois dados para liberar seu acesso. Você só precisa fazer isso uma vez.
          </p>
        </div>

        {/* Campos definidos no convite, exibidos para conferência. */}
        <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <span className="text-xs uppercase tracking-wide text-text-light">E-mail</span>
            <span className="truncate text-sm font-medium text-text-dark">{user?.email}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-xs uppercase tracking-wide text-text-light">Perfil</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-text-dark">
              <Lock size={12} className="text-text-light" />
              {CARGOS[user?.user_type ?? ''] ?? user?.user_type}
            </span>
          </div>
          <p className="border-t border-border-light pt-3 text-xs text-text-light">
            Definidos pelo administrador que liberou seu acesso. Para alterá-los, fale com ele.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome Completo"
            type="text"
            placeholder="Seu nome completo"
            value={fullName}
            onChange={(e) => {
              setNomeDigitado(e.target.value);
              if (errors.full_name) setErrors((p) => ({ ...p, full_name: '' }));
            }}
            disabled={isSubmitting}
            error={errors.full_name}
          />

          <Input
            label="Matrícula SIAP"
            type="text"
            inputMode="numeric"
            placeholder="Somente números"
            value={siap}
            onChange={(e) => {
              setSiap(e.target.value);
              if (errors.siap_registration) setErrors((p) => ({ ...p, siap_registration: '' }));
            }}
            disabled={isSubmitting}
            error={errors.siap_registration}
          />

          <Button type="submit" disabled={isSubmitting} className="h-12 w-full font-semibold">
            {isSubmitting && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Salvando...' : 'CONCLUIR CADASTRO'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  // `allowIncompleteProfile` é obrigatório aqui: sem ele, o PrivateRoute
  // redirecionaria esta página para ela mesma, em laço.
  return (
    <PrivateRoute allowIncompleteProfile>
      <CompleteProfileForm />
    </PrivateRoute>
  );
}
