import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar Esquerda */}
      <div className="hidden md:flex md:w-1/2 bg-sidebar-dark flex-col items-center justify-center p-8 text-white">
        <div className="text-center space-y-8">
          {/* Logo IFAL */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <div className="text-2xl font-bold text-white">■ ■</div>
            </div>
            <p className="text-xs font-semibold">INSTITUTO</p>
            <p className="text-xs font-semibold">FEDERAL</p>
            <p className="text-xs">Alagoas</p>
          </div>

          {/* Logo GEFI */}
          <div className="space-y-2">
            <div className="text-5xl font-bold">
              <span className="text-white">GE</span>
              <span className="text-primary">FI</span>
            </div>
            <p className="text-lg font-light text-center">Gestão e Fiscalização</p>
            <p className="text-lg font-light text-center">Inteligente</p>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 md:hidden text-center">
            <h1 className="text-3xl font-bold text-sidebar-dark mb-2">
              <span className="text-sidebar-dark">GE</span>
              <span className="text-primary">FI</span>
            </h1>
            <p className="text-sm text-text-light">Gestão e Fiscalização Inteligente</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
