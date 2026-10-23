export interface User {
  id: number;
  name: string;
  email: string;
}

export interface OtpCredentials {
  email: string;
  code: string;
}

export interface RegistrationDetails {
  name: string;
  email: string;
}
