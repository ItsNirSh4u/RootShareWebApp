import { UserRole } from '../enums';

export interface IUser {
  id: string;
  email: string;
  username: string;
  profileImageUrl?: string;
  role: UserRole;
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
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthResponse {
  user: IUser;
  tokens: IAuthTokens;
}
