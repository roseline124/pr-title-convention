export function formatMessage(message: string, values?: Record<string, any>) {
  let formatted = message;
  if (values) {
    Object.entries(values).forEach(([key, value]) => {
      formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), value);
    });
  }
  return formatted;
}
