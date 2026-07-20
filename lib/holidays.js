// Jours feries francais: calcules pour n'importe quelle annee (dates fixes + Paques)
// Vacances scolaires: donnees officielles education.gouv.fr, disponibles pour les
// annees scolaires publiees au Journal Officiel (2025-2026 et 2026-2027 pour le moment).
// Au-dela, l'appli affiche simplement "non publie" : ajoute les dates ici des qu'elles sortent.

function pad(n) {
  return String(n).padStart(2, '0');
}
function toISO(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

// Algorithme de Meeus/Jones/Butcher pour le dimanche de Paques
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}
function addDays(date, n) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}
function dateToISO(d) {
  return toISO(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function publicHolidaysForYear(year) {
  const easter = easterSunday(year);
  return [
    { date: toISO(year, 1, 1), name: "Jour de l'an" },
    { date: dateToISO(addDays(easter, 1)), name: 'Lundi de Paques' },
    { date: toISO(year, 5, 1), name: 'Fete du travail' },
    { date: toISO(year, 5, 8), name: 'Victoire 1945' },
    { date: dateToISO(addDays(easter, 39)), name: "Jeudi de l'Ascension" },
    { date: dateToISO(addDays(easter, 50)), name: 'Lundi de Pentecote' },
    { date: toISO(year, 7, 14), name: 'Fete nationale' },
    { date: toISO(year, 8, 15), name: 'Assomption' },
    { date: toISO(year, 11, 1), name: 'La Toussaint' },
    { date: toISO(year, 11, 11), name: 'Armistice 1918' },
    { date: toISO(year, 12, 25), name: 'Noel' },
  ];
}

export function isHoliday(dateStr) {
  const year = parseInt(dateStr.slice(0, 4), 10);
  const all = [...publicHolidaysForYear(year - 1), ...publicHolidaysForYear(year), ...publicHolidaysForYear(year + 1)];
  return all.find((h) => h.date === dateStr) || null;
}

// Vacances scolaires officielles par annee scolaire (cle = annee de la rentree, ex 2026 => sept 2026 a aout 2027)
export const schoolVacationsByYear = {
  2025: {
    A: [
      { name: 'Toussaint', from: '2025-10-18', to: '2025-11-03' },
      { name: 'Noel', from: '2025-12-20', to: '2026-01-05' },
      { name: 'Hiver', from: '2026-02-07', to: '2026-02-23' },
      { name: 'Printemps', from: '2026-04-04', to: '2026-04-20' },
      { name: 'Ete', from: '2026-07-04', to: '2026-08-31' },
    ],
    B: [
      { name: 'Toussaint', from: '2025-10-18', to: '2025-11-03' },
      { name: 'Noel', from: '2025-12-20', to: '2026-01-05' },
      { name: 'Hiver', from: '2026-02-14', to: '2026-03-02' },
      { name: 'Printemps', from: '2026-04-11', to: '2026-04-27' },
      { name: 'Ete', from: '2026-07-04', to: '2026-08-31' },
    ],
    C: [
      { name: 'Toussaint', from: '2025-10-18', to: '2025-11-03' },
      { name: 'Noel', from: '2025-12-20', to: '2026-01-05' },
      { name: 'Hiver', from: '2026-02-21', to: '2026-03-09' },
      { name: 'Printemps', from: '2026-04-18', to: '2026-05-04' },
      { name: 'Ete', from: '2026-07-04', to: '2026-08-31' },
    ],
  },
  2026: {
    A: [
      { name: 'Toussaint', from: '2026-10-17', to: '2026-11-02' },
      { name: 'Noel', from: '2026-12-19', to: '2027-01-04' },
      { name: 'Hiver', from: '2027-02-13', to: '2027-03-01' },
      { name: 'Printemps', from: '2027-04-10', to: '2027-04-26' },
      { name: 'Ete', from: '2027-07-03', to: '2027-08-31' },
    ],
    B: [
      { name: 'Toussaint', from: '2026-10-17', to: '2026-11-02' },
      { name: 'Noel', from: '2026-12-19', to: '2027-01-04' },
      { name: 'Hiver', from: '2027-02-20', to: '2027-03-08' },
      { name: 'Printemps', from: '2027-04-17', to: '2027-05-03' },
      { name: 'Ete', from: '2027-07-03', to: '2027-08-31' },
    ],
    C: [
      { name: 'Toussaint', from: '2026-10-17', to: '2026-11-02' },
      { name: 'Noel', from: '2026-12-19', to: '2027-01-04' },
      { name: 'Hiver', from: '2027-02-06', to: '2027-02-22' },
      { name: 'Printemps', from: '2027-04-03', to: '2027-04-19' },
      { name: 'Ete', from: '2027-07-03', to: '2027-08-31' },
    ],
  },
};

export function isVacation(dateStr, zone) {
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(5, 7), 10);
  const schoolYear = month >= 8 ? year : year - 1;
  const ranges = (schoolVacationsByYear[schoolYear] || {})[zone] || [];
  return ranges.some((r) => dateStr >= r.from && dateStr <= r.to)
    ? ranges.find((r) => dateStr >= r.from && dateStr <= r.to)
    : null;
}
