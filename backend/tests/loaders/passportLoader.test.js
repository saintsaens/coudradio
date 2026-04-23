import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';

// Captured callbacks — assigned when passportLoader calls passport.use / serializeUser / deserializeUser
let capturedVerify;
let serializeCallback;
let deserializeCallback;

vi.mock('passport', () => ({
    default: {
        initialize: vi.fn().mockReturnValue(vi.fn()),
        session: vi.fn().mockReturnValue(vi.fn()),
        use: vi.fn(),
        serializeUser: vi.fn().mockImplementation((cb) => { serializeCallback = cb; }),
        deserializeUser: vi.fn().mockImplementation((cb) => { deserializeCallback = cb; }),
    },
}));

vi.mock('passport-google-oauth20', () => ({
    default: vi.fn().mockImplementation(function (_options, verify) {
        capturedVerify = verify;
    }),
}));

vi.mock('../../services/fedCredService.js');
vi.mock('../../services/usersService.js');

import * as fedCredService from '../../services/fedCredService.js';
import * as usersService from '../../services/usersService.js';
import passportLoader from '../../loaders/passportLoader.js';

const mockApp = { use: vi.fn() };

const mockProfile = {
    id: 'google-123',
    displayName: 'Alice',
    emails: [{ value: 'alice@example.com' }],
};

const mockFullUser = {
    id: 1,
    username: 'alice',
    role: 'user',
    session_start_time: new Date('2024-01-01'),
    last_activity_time: new Date('2024-01-01'),
    time_spent: 0,
    subscribed: false,
    email: 'alice@example.com',
};

beforeAll(() => {
    passportLoader(mockApp);
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Google OAuth verify callback — new user', () => {
    it('creates a credential, fetches the full user, and calls cb with the complete object', async () => {
        fedCredService.getGoogleCredential.mockResolvedValue(null);
        fedCredService.createGoogleCredential.mockResolvedValue({ id: 1 });
        usersService.getUserById.mockResolvedValue(mockFullUser);
        usersService.getTotalListeningTime.mockResolvedValue(0);

        const cb = vi.fn();
        await capturedVerify(null, null, mockProfile, cb);

        expect(fedCredService.createGoogleCredential).toHaveBeenCalledWith(mockProfile);
        expect(usersService.getUserById).toHaveBeenCalledWith(1);
        expect(cb).toHaveBeenCalledWith(null, {
            id: 1,
            username: 'alice',
            role: 'user',
            sessionStartTime: mockFullUser.session_start_time,
            lastActivity: mockFullUser.last_activity_time,
            timeSpent: 0,
            subscribed: false,
            email: 'alice@example.com',
        });
    });
});

describe('Google OAuth verify callback — returning user', () => {
    it('fetches existing user by credential user_id and calls cb with the complete object', async () => {
        fedCredService.getGoogleCredential.mockResolvedValue({ user_id: 1 });
        usersService.getUserById.mockResolvedValue(mockFullUser);
        usersService.getTotalListeningTime.mockResolvedValue(0);

        const cb = vi.fn();
        await capturedVerify(null, null, mockProfile, cb);

        expect(fedCredService.createGoogleCredential).not.toHaveBeenCalled();
        expect(usersService.getUserById).toHaveBeenCalledWith(1);
        expect(cb).toHaveBeenCalledWith(null, {
            id: 1,
            username: 'alice',
            role: 'user',
            sessionStartTime: mockFullUser.session_start_time,
            lastActivity: mockFullUser.last_activity_time,
            timeSpent: 0,
            subscribed: false,
            email: 'alice@example.com',
        });
    });

    it('calls cb(null, false) when the user row is not found', async () => {
        fedCredService.getGoogleCredential.mockResolvedValue({ user_id: 99 });
        usersService.getUserById.mockResolvedValue(null);

        const cb = vi.fn();
        await capturedVerify(null, null, mockProfile, cb);

        expect(cb).toHaveBeenCalledWith(null, false);
    });
});

describe('Google OAuth verify callback — error handling', () => {
    it('calls cb with an error when profile is null', async () => {
        const cb = vi.fn();
        await capturedVerify(null, null, null, cb);

        expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it('calls cb with an error when profile has no id', async () => {
        const cb = vi.fn();
        await capturedVerify(null, null, { displayName: 'No ID' }, cb);

        expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it('calls cb with an error when a service throws', async () => {
        fedCredService.getGoogleCredential.mockRejectedValue(new Error('DB error'));

        const cb = vi.fn();
        await capturedVerify(null, null, mockProfile, cb);

        expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });
});

describe('serializeUser', () => {
    it('serializes all user fields into the session', async () => {
        const user = {
            id: 1, username: 'alice', role: 'user',
            sessionStartTime: new Date('2024-01-01'),
            lastActivity: new Date('2024-01-01'),
            timeSpent: 100, subscribed: true, email: 'alice@example.com',
        };

        await new Promise((resolve) => {
            serializeCallback(user, (err, serialized) => {
                expect(err).toBeNull();
                expect(serialized).toEqual(user);
                resolve();
            });
        });
    });
});

describe('deserializeUser', () => {
    it('returns the session user as-is', async () => {
        const sessionUser = { id: 1, username: 'alice', subscribed: true };

        await new Promise((resolve) => {
            deserializeCallback(sessionUser, (err, user) => {
                expect(err).toBeNull();
                expect(user).toEqual(sessionUser);
                resolve();
            });
        });
    });
});
