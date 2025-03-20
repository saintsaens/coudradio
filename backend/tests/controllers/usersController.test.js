import { vi, test, expect, describe, beforeEach } from 'vitest';
import * as usersService from "../../services/usersService.js";
import { createUser, updateUser, deleteUser, getUserById } from "../../controllers/usersController.js";
import { Request, Response } from 'express';

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

    describe('createUser', () => {
        test('should return 400 if missing username, password or email', async () => {
            req.body = {}; // Empty request body
            await createUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Missing fields' });
        });

        test('should return 201 on successful user creation', async () => {
            req.body = { username: 'testuser', password: 'password123', email: "test@test.com" };
            const mockUser = { id: 1, username: 'testuser', email: "test@test.com" };
            usersService.createUser.mockResolvedValue(mockUser);

            await createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User created successfully',
                user: mockUser,
            });
        });

        test('should return 500 if there is an internal server error', async () => {
            req.body = { username: 'testuser', password: 'password123', email: "test@test.com" };
            usersService.createUser.mockRejectedValue(new Error('Error creating user'));

            await createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    describe('updateUser', () => {
        test('should return 400 if no username or password provided', async () => {
            req.params.id = '1';
            req.body = {}; // Empty request body
            await updateUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'At least one field must be provided' });
        });

        test('should return 200 if user is successfully updated', async () => {
            req.params.id = '1';
            req.body = { username: 'updatedUser', password: 'newPassword123' };
            const mockUpdatedUser = { id: '1', username: 'updatedUser' };
            usersService.updateUser.mockResolvedValue(mockUpdatedUser);

            await updateUser(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User updated successfully',
                user: mockUpdatedUser,
            });
        });

        test('should return 404 if user is not found', async () => {
            req.params.id = '999'; // Non-existing user ID
            req.body = { username: 'updatedUser' };
            usersService.updateUser.mockResolvedValue(null);

            await updateUser(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        test('should return 500 on internal server error', async () => {
            req.params.id = '1';
            req.body = { username: 'updatedUser' };
            usersService.updateUser.mockRejectedValue(new Error('Error updating user'));

            await updateUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    describe('deleteUser', () => {
        test('should return 404 if user not found', async () => {
            req.params.id = '999'; // Non-existing user ID
            usersService.deleteUser.mockResolvedValue(null);

            await deleteUser(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        test('should return 200 if user is successfully deleted', async () => {
            req.params.id = '1';
            usersService.deleteUser.mockResolvedValue(true);

            await deleteUser(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
        });

        test('should return 500 on internal server error', async () => {
            req.params.id = '1';
            usersService.deleteUser.mockRejectedValue(new Error('Error deleting user'));

            await deleteUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    describe('getUserById', () => {
        test('should return 404 if user is not found', async () => {
            req.params.id = '999'; // Non-existing user ID
            usersService.getUserById.mockResolvedValue(null);

            await getUserById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        test('should return 200 and user data if user is found', async () => {
            req.params.id = '1';
            const mockUser = { id: '1', username: 'testuser' };
            usersService.getUserById.mockResolvedValue(mockUser);

            await getUserById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        test('should return 500 on internal server error', async () => {
            req.params.id = '1';
            usersService.getUserById.mockRejectedValue(new Error('Error fetching user'));

            await getUserById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching user' });
        });
    });

});