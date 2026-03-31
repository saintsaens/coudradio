import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as usersService from '../../services/usersService.js';
import { logout, getUserProfile } from '../../controllers/authController.js';

vi.mock('../../services/usersService.js');
vi.mock('passport', () => ({
    default: {
        authenticate: vi.fn(() => vi.fn()),
    },
}));

describe('logout', () => {
    let res;

    beforeEach(() => {
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
    });

    it('sends a success message on clean logout', async () => {
        const req = { logout: vi.fn((cb) => cb(null)) };

        await logout(req, res);

        expect(res.json).toHaveBeenCalledWith({ message: 'Logout successful' });
    });

    it('returns 500 if passport logout signals an error', async () => {
        const req = { logout: vi.fn((cb) => cb(new Error('session error'))) };

        await logout(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Logout failed' });
    });
});

describe('getUserProfile', () => {
    let res;

    beforeEach(() => {
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
    });

    it('returns 401 if the user is not authenticated', async () => {
        const req = { isAuthenticated: vi.fn().mockReturnValue(false) };

        await getUserProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('returns the full user profile when authenticated and user is found in DB', async () => {
        const mockDbUser = { id: 1, subscribed: true };
        vi.mocked(usersService.getUserById).mockResolvedValue(mockDbUser);
        const req = {
            isAuthenticated: vi.fn().mockReturnValue(true),
            user: {
                id: 1,
                username: 'alice',
                sessionStartTime: null,
                lastActivity: null,
                timeSpent: 0,
                subscribed: false,
                email: 'alice@example.com',
            },
        };

        await getUserProfile(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            id: 1,
            username: 'alice',
            subscribed: true,  // reflects the DB value, not the session value
        }));
    });

    it('returns 404 if the user is not found in the database', async () => {
        vi.mocked(usersService.getUserById).mockResolvedValue(null);
        const req = {
            isAuthenticated: vi.fn().mockReturnValue(true),
            user: { id: 99 },
        };

        await getUserProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
});
