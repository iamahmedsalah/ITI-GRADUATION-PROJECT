import { Types } from 'mongoose';

export type UserRole = 'student' | 'instructor' | 'admin';

export interface AuthenticatedUser {
  _id: Types.ObjectId;
  id: string;
  email: string;
  username: string;
  role: UserRole;
}
