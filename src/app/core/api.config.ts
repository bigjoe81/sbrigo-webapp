declare global {
  interface Window {
    SBRIGO_API_URL?: string;
  }
}

const localHosts = ['localhost', '127.0.0.1', '::1', '[::1]'];
const isLocalHost = localHosts.includes(window.location.hostname);
const configuredApiUrl = window.SBRIGO_API_URL?.trim().replace(/\/+$/, '');

if (!isLocalHost) {
  if (!configuredApiUrl) {
    throw new Error('Configura SBRIGO_API_URL prima di distribuire Sbrigo.');
  }

  if (
    window.location.protocol !== 'https:' ||
    new URL(configuredApiUrl).protocol !== 'https:'
  ) {
    throw new Error('Sbrigo richiede frontend e API HTTPS fuori dallo sviluppo locale.');
  }
}

export const API_URL =
  configuredApiUrl ||
  `${window.location.protocol}//${window.location.hostname}:8000`;
export const API_BASE_URL = `${API_URL}/api`;
export const OTP_SEND_URL = `${API_BASE_URL}/otp/send`;
export const OTP_VERIFY_URL = `${API_BASE_URL}/otp/verify`;
export const REGISTER_URL = `${API_BASE_URL}/register`;
export const LOGOUT_URL = `${API_BASE_URL}/logout`;
export const CURRENT_USER_URL = `${API_BASE_URL}/user`;
