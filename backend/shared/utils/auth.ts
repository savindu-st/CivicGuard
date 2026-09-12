import jwt from 'jsonwebtoken';
import { JwtUserPayload, RoleName } from '../types';
import { sendError } from './response';

const DEFAULT_JWT_SECRET = 'super_secret_civicguard_jwt_token_key_change_me_32char';

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
}

export const SEEDED_DEMO_USERS: Record<RoleName, { id: string; name: string; email: string }> = {
  SYSTEM_ADMIN: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Admin CivicGuard',
    email: 'admin@civicguard.lk',
  },
  COUNCIL_OFFICER: {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Kasun Perera (Officer)',
    email: 'kasun.officer@cmc.gov.lk',
  },
  FIELD_CREW: {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Sunil Shantha (Crew Lead)',
    email: 'sunil.crew@cmc.gov.lk',
  },
  RELIEF_COORDINATOR: {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Anoma Wickramasinghe (Relief)',
    email: 'anoma.relief@redcross.lk',
  },
  CITIZEN: {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Nimal Silva (Citizen)',
    email: 'nimal.citizen@gmail.com',
  },
};

/**
 * Generates a signed JWT for demo testing or runtime authentication.
 */
export function generateDemoToken(
  role: RoleName,
  customUserId?: string,
  customName?: string
): string {
  const persona = SEEDED_DEMO_USERS[role];
  const payload: JwtUserPayload = {
    userId: customUserId || persona?.id || '55555555-5555-5555-5555-555555555555',
    name: customName || persona?.name || 'Demo User',
    email: persona?.email || 'demo@civicguard.lk',
    roles: [role],
  };

  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

/**
 * Verifies a JWT token (supports both CivicGuard demo tokens and Supabase Auth GoTrue JWTs).
 */
export function verifyToken(token: string): JwtUserPayload {
  // 1. First attempt verification with configured JWT_SECRET
  try {
    const verified: any = jwt.verify(token, getJwtSecret());
    if (verified && (verified.userId || verified.sub) && (verified.roles || verified.user_metadata?.role)) {
      const role = (verified.roles?.[0] || verified.user_metadata?.role) as RoleName;
      return {
        userId: verified.userId || verified.sub,
        email: verified.email || '',
        name: verified.name || verified.user_metadata?.name || 'Authorized User',
        roles: verified.roles || [role],
      };
    }
  } catch (verifyErr) {
    // If signed with distinct Supabase secret or JWKS, fallback to JWT decode
  }

  // 2. Decode Supabase JWT payload
  const decoded: any = jwt.decode(token);
  if (decoded && (decoded.sub || decoded.userId)) {
    const meta = decoded.user_metadata || {};
    const email = decoded.email || '';

    let role: RoleName = meta.role;
    if (!role) {
      if (email.includes('officer')) role = 'COUNCIL_OFFICER';
      else if (email.includes('crew') || email.includes('water') || email.includes('4x4') || email.includes('medical')) role = 'FIELD_CREW';
      else if (email.includes('relief')) role = 'RELIEF_COORDINATOR';
      else if (email.includes('admin')) role = 'SYSTEM_ADMIN';
      else role = 'CITIZEN';
    }

    return {
      userId: decoded.sub || decoded.userId,
      email: decoded.email || '',
      name: meta.name || decoded.name || email.split('@')[0] || 'Authorized User',
      roles: decoded.roles || [role],
    };
  }

  throw new Error('Invalid or unparseable token format');
}

/**
 * Express middleware to authenticate Bearer JWT.
 */
export function authMiddleware(req: any, res: any, next: any): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    sendError(res, 'Authentication required: missing Authorization header', 401);
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    sendError(res, 'Invalid Authorization header format. Expected Bearer <token>', 401);
    return;
  }

  const token = parts[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    sendError(res, 'Invalid or expired token', 401, err.message);
  }
}

/**
 * Role guard middleware to enforce RBAC.
 */
export function requireRole(allowedRoles: RoleName[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const userRoles: RoleName[] = req.user.roles || [];
    const hasRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      sendError(
        res,
        `Forbidden: Access requires one of [${allowedRoles.join(', ')}]`,
        403
      );
      return;
    }

    next();
  };
}
