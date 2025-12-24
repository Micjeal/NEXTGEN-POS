export const formatDate = (dateString: string | Date, options: Intl.DateTimeFormatOptions = {}) => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

export const getDateRange = (days: number) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
};

export const formatDateRange = (start: Date, end: Date) => {
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
};
