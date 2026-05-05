import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <p className="text-2xl font-semibold text-gray-700 mt-2">Página não encontrada</p>
        </div>

        <p className="text-gray-600 max-w-md mx-auto">
          Desculpe, a página que você está procurando não existe ou foi movida.
        </p>

        <Link href="/dashboard">
          <Button className="px-6 py-3">Voltar para o Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
