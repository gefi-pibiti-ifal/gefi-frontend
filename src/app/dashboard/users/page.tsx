'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import api, { getErrorMessage } from '@/lib/api';
import { PaginatedUsers, User, UserType } from '@/types';

const POR_PAGINA = 10;

const OPCOES_CARGO = [
  { value: 'FISCAL', label: 'Fiscal' },
  { value: 'ADMINISTRADOR', label: 'Administrador' },
];

/**
 * Administração de acessos.
 *
 * É a contrapartida de ter removido o cadastro público: como ninguém mais se
 * cadastra sozinho, precisa existir um lugar onde um administrador libere
 * pessoas. Sem esta tela, liberar um fiscal exigiria acesso ao banco.
 */
function UsersAdmin() {
  const { user: usuarioAtual } = useAuth();

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregandoLista, setCarregandoLista] = useState(true);

  const [novoEmail, setNovoEmail] = useState('');
  const [novoCargo, setNovoCargo] = useState<UserType>('FISCAL');
  const [convidando, setConvidando] = useState(false);
  const [erroConvite, setErroConvite] = useState<string | null>(null);

  const [emAcao, setEmAcao] = useState<string | null>(null);
  const [paraRemover, setParaRemover] = useState<User | null>(null);

  const carregar = useCallback(async (paginaAtual: number, termo: string) => {
    try {
      setCarregandoLista(true);
      const { data } = await api.get<PaginatedUsers>('/users', {
        params: { page: paginaAtual, limit: POR_PAGINA, search: termo || undefined },
      });
      setUsuarios(data.data);
      setTotalPaginas(data.meta.totalPages);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCarregandoLista(false);
    }
  }, []);

  // Debounce na busca, como em /dashboard/documents.
  useEffect(() => {
    const timer = setTimeout(() => void carregar(pagina, busca), 400);
    return () => clearTimeout(timer);
  }, [pagina, busca, carregar]);

  const convidar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroConvite(null);

    const email = novoEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErroConvite('Informe um e-mail válido.');
      return;
    }

    try {
      setConvidando(true);
      await api.post('/users', { email, user_type: novoCargo });
      toast.success(`${email} pode acessar o sistema.`);
      setNovoEmail('');
      setNovoCargo('FISCAL');
      setPagina(1);
      await carregar(1, busca);
    } catch (error) {
      setErroConvite(getErrorMessage(error));
    } finally {
      setConvidando(false);
    }
  };

  const alterarCargo = async (alvo: User, cargo: UserType) => {
    try {
      setEmAcao(alvo.id);
      await api.patch(`/users/${alvo.id}`, { user_type: cargo });
      setUsuarios((prev) =>
        prev.map((u) => (u.id === alvo.id ? { ...u, user_type: cargo } : u)),
      );
      toast.success('Perfil atualizado.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setEmAcao(null);
    }
  };

  const confirmarRemocao = async () => {
    if (!paraRemover) return;

    try {
      setEmAcao(paraRemover.id);
      const { data } = await api.delete<{ revogado: boolean }>(`/users/${paraRemover.id}`);
      // O backend decide entre apagar e revogar conforme o histórico da conta;
      // a mensagem precisa refletir o que de fato aconteceu.
      toast.success(data.revogado ? 'Acesso revogado.' : 'Convite removido.');
      await carregar(pagina, busca);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setEmAcao(null);
      setParaRemover(null);
    }
  };

  const situacao = (u: User) => {
    if (u.revoked_at) return { texto: 'Revogado', classe: 'bg-red-100 text-red-700' };
    if (!u.profile_completed) return { texto: 'Aguardando 1º acesso', classe: 'bg-amber-100 text-amber-700' };
    return { texto: 'Ativo', classe: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-10">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
            <p className="mt-2 text-gray-600">
              Libere o acesso cadastrando o e-mail institucional. A pessoa completa o próprio
              perfil no primeiro login.
            </p>
          </div>

          <div className="relative w-full shrink-0 md:max-w-md">
            <Input
              placeholder="Pesquisar por nome ou e-mail..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              className="h-12 w-full pl-12 text-base shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <form
          onSubmit={convidar}
          className="rounded-xl border border-border-light bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-text-dark">
            <UserPlus size={18} className="text-primary" />
            Cadastrar novo acesso
          </h2>

          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <Input
                label="E-mail institucional"
                type="email"
                placeholder="fulano@ifal.edu.br"
                value={novoEmail}
                onChange={(e) => {
                  setNovoEmail(e.target.value);
                  if (erroConvite) setErroConvite(null);
                }}
                disabled={convidando}
                error={erroConvite ?? undefined}
              />
            </div>

            <div className="w-full md:w-52">
              <Select
                label="Perfil"
                value={novoCargo}
                onChange={(e) => setNovoCargo(e.target.value as UserType)}
                disabled={convidando}
                options={OPCOES_CARGO}
              />
            </div>

            <Button type="submit" disabled={convidando} className="h-[42px] md:w-40">
              {convidando && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}
              {convidando ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          {carregandoLista ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : usuarios.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-light py-12 text-center text-text-light">
              Nenhum usuário encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border-light bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-border-light bg-gray-50 text-left">
                  <tr className="text-xs uppercase tracking-wide text-text-light">
                    <th className="px-4 py-3 font-medium">Pessoa</th>
                    <th className="px-4 py-3 font-medium">Situação</th>
                    <th className="px-4 py-3 font-medium">Perfil</th>
                    <th className="px-4 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => {
                    const status = situacao(u);
                    const souEu = u.id === usuarioAtual?.id;
                    const ocupado = emAcao === u.id;

                    return (
                      <tr key={u.id} className="border-b border-border-light last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-medium text-text-dark">
                            {u.full_name ?? <span className="italic text-text-light">Sem nome</span>}
                            {souEu && <span className="ml-2 text-xs text-primary">(você)</span>}
                          </div>
                          <div className="text-xs text-text-light">{u.email}</div>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.classe}`}>
                            {status.texto}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          {/* O próprio administrador não troca o próprio cargo:
                              o backend recusa, para não permitir que alguém se
                              rebaixe e perca o acesso a esta mesma tela. */}
                          {souEu ? (
                            <span className="flex items-center gap-1.5 text-xs text-text-light">
                              <ShieldCheck size={14} /> Administrador
                            </span>
                          ) : (
                            <Select
                              value={u.user_type}
                              onChange={(e) => void alterarCargo(u, e.target.value as UserType)}
                              disabled={ocupado || !!u.revoked_at}
                              options={OPCOES_CARGO}
                              className="h-9 py-1 text-xs"
                            />
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {!souEu && (
                            <button
                              onClick={() => setParaRemover(u)}
                              disabled={ocupado}
                              title="Remover acesso"
                              className="rounded-md p-2 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40"
                            >
                              {ocupado ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPaginas > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                disabled={pagina === 1 || carregandoLista}
                onClick={() => setPagina((p) => p - 1)}
                className="rounded-lg border border-gray-300 px-5 py-2.5 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="flex items-center rounded-lg bg-gray-100 px-6 text-sm font-semibold text-gray-600">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                disabled={pagina === totalPaginas || carregandoLista}
                onClick={() => setPagina((p) => p + 1)}
                className="rounded-lg border border-gray-300 px-5 py-2.5 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>

      {paraRemover && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#202123] p-6 text-white shadow-2xl">
            <h2 className="mb-2 text-lg font-semibold">Remover acesso?</h2>
            <p className="mb-6 text-sm text-gray-400">
              <strong>{paraRemover.full_name ?? paraRemover.email}</strong> deixará de conseguir
              entrar no GeFi. Se a pessoa já enviou documentos ou abriu conversas, o histórico é
              preservado e apenas o acesso é revogado.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setParaRemover(null)}
                className="rounded-md px-4 py-2 text-xs transition-colors hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={() => void confirmarRemocao()}
                className="rounded-md bg-red-600 px-4 py-2 text-xs font-medium transition-colors hover:bg-red-700"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <AdminRoute>
      <DashboardLayout>
        <UsersAdmin />
      </DashboardLayout>
    </AdminRoute>
  );
}
