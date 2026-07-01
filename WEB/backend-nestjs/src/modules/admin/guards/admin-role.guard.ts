import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

type RequestWithUser = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (request.user?.role !== 'admin') {
      throw new ForbiddenException('Unauthorized admin access.');
    }

    return true;
  }
}
