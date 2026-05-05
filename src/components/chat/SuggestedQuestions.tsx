'use client';

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
  isLoading?: boolean;
}

const SUGGESTED_QUESTIONS = [
  'O que é IMR?',
  'Prazos da CGFC',
  'Prazos legais',
];

export function SuggestedQuestions({ onSelectQuestion, isLoading = false }: SuggestedQuestionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-sidebar-dark flex items-center justify-center">
          <span className="text-white text-sm font-bold">🤖</span>
        </div>
        <p className="text-sm text-text-dark">Olá! Sou o GeFi. Posso ajudar com dúvidas...</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((question, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(question)}
            disabled={isLoading}
            className="px-4 py-2 border-2 border-primary text-primary rounded-full text-sm hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
