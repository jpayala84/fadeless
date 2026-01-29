export const subtractDays = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(value);

export const formatTimeAgo = (value: Date) => {
  const seconds = Math.floor((Date.now() - value.getTime()) / 1000);
  if (seconds < 60) {
    return "just now";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
