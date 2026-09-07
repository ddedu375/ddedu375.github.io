import Link from 'next/link';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Резюме — Данила Плешаков' };
export default function Resume() {
  return (
    <main className="resume-placeholder">
      <h1>Резюме</h1>
      <p className="secondary">Ссылка на резюме появится здесь позже.</p>
      <Link href="/" className="control">
        Вернуться в портфолио
      </Link>
    </main>
  );
}
