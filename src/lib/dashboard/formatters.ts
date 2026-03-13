export const subtractDays = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(value);
