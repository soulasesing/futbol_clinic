import React from 'react';
import { Cake } from 'lucide-react';
import { EmptyState } from '../AsyncStates';

export interface DashboardBirthday {
  id: string;
  name: string;
  photoUrl?: string;
  category?: string;
  date: string;
  turnsYears: number;
}

interface BirthdaySectionProps {
  birthdays?: DashboardBirthday[];
}

const formatBirthday = (value: string): string => {
  const birthday = new Date(value);
  const today = new Date();
  if (
    birthday.getDate() === today.getDate()
    && birthday.getMonth() === today.getMonth()
  ) return 'Hoy';
  return birthday.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

const BirthdaySection: React.FC<BirthdaySectionProps> = ({ birthdays }) => (
  <section className="rounded-3xl border border-pink-100 bg-gradient-to-r from-white to-pink-50 p-6 shadow-sm">
    <h2 className="mb-4 flex items-center gap-2 text-lg font-black">
      <Cake className="h-5 w-5 text-pink-500" /> Cumpleaños próximos
    </h2>
    {!birthdays?.length ? (
      <EmptyState compact title="Sin cumpleaños cercanos" message="No hay cumpleaños durante los próximos 30 días." />
    ) : (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {birthdays.map((birthday) => (
          <article key={birthday.id} className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white p-4">
            {birthday.photoUrl ? (
              <img src={birthday.photoUrl} alt="" className="h-11 w-11 rounded-xl object-cover" />
            ) : (
              <span className="rounded-xl bg-pink-100 p-3 text-pink-600"><Cake className="h-5 w-5" /></span>
            )}
            <span className="min-w-0">
              <strong className="block truncate text-sm text-slate-900">{birthday.name}</strong>
              <span className="block text-xs font-bold text-pink-600">
                {formatBirthday(birthday.date)} · {birthday.turnsYears} años
              </span>
              {birthday.category && <span className="block text-xs text-slate-500">{birthday.category}</span>}
            </span>
          </article>
        ))}
      </div>
    )}
  </section>
);

export default BirthdaySection;
