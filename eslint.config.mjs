// ESLint flat config.
//
// O Next.js 16 removeu o comando `next lint` (dai o script `lint` chamar o
// eslint direto) e o `eslint-config-next` 16 ja publica flat config nativo --
// nao e preciso o shim FlatCompat/@eslint/eslintrc do formato legado.
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'node_modules/**',
      'next-env.d.ts',
    ],
  },
  ...coreWebVitals,
  ...typescript,
];

export default config;
