import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { Model, Types } from 'mongoose';
import { UserDocument } from '../../../database/schemas';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

type RequestWithUser = Request & {
  cookies?: Record<string, string>;
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Unauthorized. Please log in again.');
    }

    try {
      const decoded = jwt.verify(token, this.getJwtSecret()) as JwtPayload;
      const user = await this.userModel.findById(decoded.id).exec();

      if (!user || user.get('isActive') === false) {
        throw new UnauthorizedException('Unauthorized. Please log in again.');
      }

      const userId = user._id as Types.ObjectId;

      request.user = {
        _id: userId,
        id: userId.toString(),
        email: String(user.get('email')),
        username: String(user.get('username')),
        role: user.get('role') as AuthenticatedUser['role'],
      };

      return true;
    } catch {
      throw new UnauthorizedException('Unauthorized. Please log in again.');
    }
  }

  private extractToken(request: RequestWithUser) {
    const authHeader = request.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }

    return request.cookies?.accessToken || request.cookies?.token;
  }

  private getJwtSecret() {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new UnauthorizedException('Server auth configuration error.');
    }

    return secret;
  }
}
