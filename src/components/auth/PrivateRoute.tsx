'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  children: React.ReactNode;
  /**
   * Use na própria tela de conclusão de perfil, que precisa de sessão mas não
   * pode exigir o perfil já preenchido -- sem isto, ela redirecionaria para si
   * mesma em laço.
   */
  allowIncompleteProfile?: boolean;
}

/**
 * Proteção de conveniência, não de segurança: roda no navegador e serve para
 * não exibir tela de dados a quem não está logado. Quem de fato impede o
 * acesso são os guards da API -- é lá que a decisão vale.
 */
export function PrivateRoute({ children, allowIncompleteProfile = false }: PrivateRouteProps) {
  const { isAuthenticated, needsProfile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (needsProfile && !allowIncompleteProfile && pathname !== '/complete-profile') {
      router.replace('/complete-profile');
    }
  }, [isAuthenticated, needsProfile, isLoading, allowIncompleteProfile, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (needsProfile && !allowIncompleteProfile) return null;

  return <>{children}</>;
}
