import 'dotenv/config';

export function getBaseUrl() {
  return (process.env.PAPERBD_BASE_URL || 'https://paperbreakdown.com').replace(/\/+$/, '');
}
