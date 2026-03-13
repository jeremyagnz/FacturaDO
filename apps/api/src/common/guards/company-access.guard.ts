import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Verifies that the authenticated user has access to the requested company (tenancy guard).
 * The companyId can come from route params (:companyId) or request body.
 */
@Injectable()
export class CompanyAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Super admins bypass tenancy checks
    if (user.role === 'super_admin') {
      return true;
    }

    const companyId =
      request.params?.companyId ||
      request.body?.companyId ||
      request.query?.companyId;

    if (!companyId) {
      return true;
    }

    const userCompanyIds: string[] = user.companies?.map((c: { id: string }) => c.id) ?? [];

    if (!userCompanyIds.includes(companyId)) {
      throw new ForbiddenException('Access denied to this company');
    }

    return true;
  }
}
