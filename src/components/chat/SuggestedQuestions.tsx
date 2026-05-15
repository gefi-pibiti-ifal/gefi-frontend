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
    // Adicionado justify-center e gap-4 (maior espaçamento)
    <div className="flex flex-wrap justify-center gap-4 w-full">
      {SUGGESTED_QUESTIONS.map((question, idx) => (
        <button
          key={idx}
          onClick={() => onSelectQuestion(question)}
          disabled={isLoading}
          className="px-5 py-2.5 border-2 border-primary text-primary rounded-full text-sm font-medium hover:bg-primary hover:text-white transition-all disabled:opacity-50 shadow-sm"
        >
          {question}
        </button>
      ))}
    </div>
  );
}