/**
 * @file user.routes.ts
 * @description Express route definitions for public user management (`/api/v1/users`).
 *
 * Registration and login are public. Listing users requires an admin JWT.
 * Update is restricted to the user themselves; delete accepts either the
 * user's own token or an admin token.
 *
 * Route summary:
 * | Method | Path      | Auth            | Description                   |
 * |--------|-----------|-----------------|-------------------------------|
 * | POST   | /         | public          | Register a new user           |
 * | GET    | /:userId  | public          | Get single user               |
 * | GET    | /         | admin           | List users (filtered, paged)  |
 * | DELETE | /:userId  | admin or self   | Delete user                   |
 * | PUT    | /:userId  | self (user JWT) | Update user profile           |
 * | POST   | /login    | public          | User login                    |
 */

import { Router } from 'express';
import type { Response, NextFunction } from 'express';

import type { UserService } from '../../services/user.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { createUserSchema, updateUserSchema, loginUserSchema, getUsersQuerySchema } from '../../validators/user.validators.js';

/**
 * Factory that creates and returns the user router.
 *
 * @param userService             - Business-logic service for user operations.
 * @param verifyAdminToken        - Middleware that validates admin JWTs.
 * @param verifyUserToken         - Middleware that validates user JWTs.
 * @param verifyTokenForDeleteUser - Middleware that accepts admin OR user JWTs.
 */
export function createUserRouter(
  userService: UserService,
  verifyAdminToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void,
  verifyUserToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void,
  verifyTokenForDeleteUser: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void,
): Router {
  const router = Router();

  /* ── POST /  — register a new user (public) ────────────────────────── */
  router.post(
    '/',
    validate(createUserSchema),
    async (req, res, next) => {
      try {
        const user = await userService.create(req.body);
        res.status(201).json(user);
      } catch (err) { next(err); }
    },
  );

  /* ── GET /:userId  — get a single user by ID ───────────────────────── */
  router.get(
    '/:userId',
    async (req, res, next) => {
      try {
        const user = await userService.findById(req.params.userId);
        res.json(user);
      } catch (err) { next(err); }
    },
  );

  /* ── GET /  — list users with optional filters & pagination (admin) ── */
  router.get(
    '/',
    verifyAdminToken,
    validate(getUsersQuerySchema, 'query'),
    async (req, res, next) => {
      try {
        // After Zod validation, `req.query` contains coerced numbers.
        const { skip, limit, ...filter } = req.query as unknown as {
          skip: number;
          limit: number;
          username?: string;
          tel?: string;
          email?: string;
        };
        const users = await userService.findMany(filter, skip, limit);
        res.json(users);
      } catch (err) { next(err); }
    },
  );

  /* ── DELETE /:userId  — delete user (admin or owner) ────────────────── */
  router.delete(
    '/:userId',
    verifyTokenForDeleteUser,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const requesterId = req.authData?.id ?? '';
        const isAdmin = req.authData?.isAdmin ?? false;
        await userService.deleteById(req.params.userId, requesterId, isAdmin);
        res.status(204).end();
      } catch (err) { next(err); }
    },
  );

  /* ── PUT /:userId  — update user profile (owner only) ──────────────── */
  router.put(
    '/:userId',
    verifyUserToken,
    validate(updateUserSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const requesterId = req.userAuthData?.id ?? req.authData?.id ?? '';
        const result = await userService.update(req.params.userId, requesterId, req.body);
        // Return the fresh JWT so the client can store the updated username.
        res.header('auth-token', result.token);
        res.status(200).json({ success: true });
      } catch (err) { next(err); }
    },
  );

  /* ── POST /login  — user authentication (public) ───────────────────── */
  router.post(
    '/login',
    validate(loginUserSchema),
    async (req, res, next) => {
      try {
        const result = await userService.login(req.body.username, req.body.tel);
        res.json(result);
      } catch (err) { next(err); }
    },
  );

  return router;
}
