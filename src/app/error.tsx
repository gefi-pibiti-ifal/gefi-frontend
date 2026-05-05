'use client';

import { Button } from '@/components/ui/Button';

export default function Error({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-6xl font-bold text-gray-900">500</h1>
          <p className="text-2xl font-semibold text-gray-700 mt-2">Erro Interno</p>
        </div>

        <p className="text-gray-600 max-w-md mx-auto">
          Desculpe, algo deu errado. Por favor, tente novamente.
        </p>

        <Button onClick={() => reset()}>Tentar Novamente</Button>
      </div>
    </div>
  );
}
