import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary-light to-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">GeFi Docs</h1>
          <p className="text-white/80">Gestão e Fiscalização Inteligente</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
