import { describe, it, expect, vi } from 'vitest';
import { isAuthenticated } from '../../middleware/authMiddleware.js';

describe('isAuthenticated', () => {
    it('calls next() when user is authenticated', () => {
        const req = { isAuthenticated: vi.fn().mockReturnValue(true) };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        isAuthenticated(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 and does not call next() when user is not authenticated', () => {
        const req = { isAuthenticated: vi.fn().mockReturnValue(false) };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        isAuthenticated(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ err: 'Not logged in' });
    });
});
