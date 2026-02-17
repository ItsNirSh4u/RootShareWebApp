import { UserRole, AuthProvider } from '../enums';

export interface IUser {
  id: string;
  email: string;
  username: string;
  profileImageUrl?: string;
  localProfileImageUrl?: string;
  role: UserRole;
  authProvider: AuthProvider;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRegistration {
  email: string;
  username: string;
  password: string;
}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface IUserUpdate {
  username?: string;
  profileImageUrl?: string;
  localProfileImageUrl?: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthResponse {
  user: IUser;
  tokens: IAuthTokens;
}
