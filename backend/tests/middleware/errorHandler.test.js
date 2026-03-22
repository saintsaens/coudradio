import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from '../../middleware/errorHandler.js';
import { NotFoundError, ValidationError } from '../../errors.js';

describe('errorHandler', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        next = vi.fn();
    });

    it('returns 404 for NotFoundError', () => {
        errorHandler(new NotFoundError('User not found'), req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('returns 400 for ValidationError', () => {
        errorHandler(new ValidationError('Invalid input'), req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid input' });
    });

    it('returns 500 for generic errors without leaking the message', () => {
        errorHandler(new Error('DB connection failed'), req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
});
