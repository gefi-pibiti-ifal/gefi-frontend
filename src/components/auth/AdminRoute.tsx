'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { PrivateRoute } from './PrivateRoute';

/**
 * Esconde telas exclusivas de administrador. Como o PrivateRoute, é uma camada
 * de interface: a API recusa a requisição com 403 de qualquer forma (RolesGuard).
 *
 * Ao contrário de um redirecionamento silencioso, aqui a pessoa vê por que não
 * pode entrar -- um fiscal que recebeu o link de outra pessoa entende a
 * situação em vez de achar que a página quebrou.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute>
      <AdminGate>{children}</AdminGate>
    </PrivateRoute>
  );
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-border-light bg-white p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h2 className="mb-2 text-lg font-semibold text-text-dark">Acesso restrito</h2>
          <p className="mb-6 text-sm text-text-light">
            Esta área é exclusiva para administradores do sistema.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-sidebar-dark hover:opacity-90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
