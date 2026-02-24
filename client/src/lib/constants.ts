export const CATEGORY_COLOR_MAP: Record<string, { bg: string; text: string; badge: string; dot: string }> = {
  amber: { bg: 'bg-amber-100', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
  red: { bg: 'bg-red-100', text: 'text-red-800', badge: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-800', badge: 'bg-pink-100 text-pink-800 border-pink-200', dot: 'bg-pink-500' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-800', badge: 'bg-teal-100 text-teal-800 border-teal-200', dot: 'bg-teal-500' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-800', badge: 'bg-slate-100 text-slate-800 border-slate-200', dot: 'bg-slate-500' },
};

export const AVAILABLE_COLORS = Object.keys(CATEGORY_COLOR_MAP);

export const ORDINALS: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  [-1]: 'last',
};

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
