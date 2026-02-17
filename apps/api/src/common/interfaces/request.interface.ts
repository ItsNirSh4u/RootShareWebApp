import { Request } from 'express';

export interface IRequest extends Request {
  user: {
    id: string;
    _id: string;
    email: string;
    username: string;
  };
}
