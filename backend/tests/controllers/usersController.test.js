import { vi, test, expect, describe, beforeEach } from 'vitest';
import * as usersService from "../../services/usersService.js";
import { updateUserActivity, updateSessionStartTime, getListeners, getUserRank } from "../../controllers/usersController.js";

// Mocks for the usersService functions
vi.mock('../../services/usersService.js');

describe('User Controller Tests', () => {

    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    describe('updateUserActivity', () => {
        test('should return 200 with updated user', async () => {
            const mockUpdatedUser = { id: 1, username: 'alice', time_spent: 10 };
            req.user = { id: 1, lastActivity: new Date(), timeSpent: 0 };
            usersService.updateUser.mockResolvedValue(mockUpdatedUser);

            await updateUserActivity(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User activity updated successfully',
                user: mockUpdatedUser,
            }));
        });

        test('should return 404 if the user is not found', async () => {
            req.user = { id: 99, lastActivity: new Date(), timeSpent: 0 };
            usersService.updateUser.mockResolvedValue(null);

            await updateUserActivity(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        test('should return 500 on service error', async () => {
            req.user = { id: 1, lastActivity: new Date(), timeSpent: 0 };
            usersService.updateUser.mockRejectedValue(new Error('DB error'));

            await updateUserActivity(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    describe('updateSessionStartTime', () => {
        test('should return 200', async () => {
            req.user = { id: 1, lastActivity: null, sessionStartTime: null };
            usersService.updateUser.mockResolvedValue({ id: 1 });

            await updateSessionStartTime(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User activity updated successfully',
            }));
        });

        test('should return 404 if user is not found', async () => {
            req.user = { id: 99, lastActivity: null, sessionStartTime: null };
            usersService.updateUser.mockResolvedValue(null);

            await updateSessionStartTime(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
        });
    });

    describe('getListeners', () => {
        test('should return 200 with listener counts', async () => {
            const mockCounts = { authenticated: 3, anonymous: 5 };
            usersService.getListenerCounts.mockResolvedValue(mockCounts);

            await getListeners(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockCounts);
        });

        test('should return 500 on service error', async () => {
            usersService.getListenerCounts.mockRejectedValue(new Error('count error'));

            await getListeners(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    describe('getUserRank', () => {
        test('should return 200 with rank and total', async () => {
            req.params.id = '1';
            usersService.getUserRankAndTotal.mockResolvedValue({ rank: 2, total: 10 });

            await getUserRank(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ rank: 2, total: 10 });
        });

        test('should return 500 on service error', async () => {
            req.params.id = '1';
            usersService.getUserRankAndTotal.mockRejectedValue(new Error('User not found'));

            await getUserRank(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

});