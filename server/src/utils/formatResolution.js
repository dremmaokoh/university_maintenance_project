const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

function formatResolutionDuration(createdAt, completedAt) {
  if (!createdAt || !completedAt) {
    return null;
  }
  const ms = new Date(completedAt) - new Date(createdAt);
  if (ms < 0) {
    return null;
  }

  const totalMinutes = Math.floor(ms / MS_PER_MINUTE);

  if (ms < MS_PER_HOUR) {
    const minutes = totalMinutes < 1 ? 1 : totalMinutes;
    return `${minutes}m`;
  }

  if (ms < MS_PER_DAY) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  }

  const days = Math.floor(ms / MS_PER_DAY);
  return days === 1 ? '1 day' : `${days} days`;
}

function formatDurationFromMs(ms) {
  if (ms == null || ms < 0) {
    return null;
  }
  return formatResolutionDuration(new Date(0), new Date(ms));
}

module.exports = { formatResolutionDuration, formatDurationFromMs };
