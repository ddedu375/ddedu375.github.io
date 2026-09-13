import type { Metadata } from 'next';
import { ResumePage } from '@/components/resume/resume-page';
export const metadata: Metadata = {
  title: 'Резюме — Данила Плешаков',
  description: 'Опыт работы, навыки и инструменты продуктового дизайнера Данилы Плешакова.',
};
export default function Resume() { return <ResumePage />; }
