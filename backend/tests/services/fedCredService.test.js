import { describe, it, expect, vi } from 'vitest';
import * as usersService from '../../services/usersService.js';
import * as fedCredRepository from '../../repositories/fedCredRepository.js';
import { createGoogleCredential, getGoogleCredential } from '../../services/fedCredService.js';

vi.mock('../../services/usersService.js');
vi.mock('../../repositories/fedCredRepository.js');

const mockProfile = {
    id: 'google-id-123',
    name: { givenName: 'Alice' },
    emails: [{ value: 'alice@example.com' }],
};

describe('createGoogleCredential', () => {
    it('creates a user and stores the federated credential, returning the credential', async () => {
        const mockUser = { id: 1, username: 'Alice' };
        const mockCredential = { id: 10, user_id: 1, provider: 'Google', subject: 'google-id-123' };
        vi.mocked(usersService.createUserWithoutPassword).mockResolvedValue(mockUser);
        vi.mocked(fedCredRepository.createFederatedCredential).mockResolvedValue(mockCredential);

        const result = await createGoogleCredential(mockProfile);

        expect(usersService.createUserWithoutPassword).toHaveBeenCalledWith('Alice', 'alice@example.com');
        expect(fedCredRepository.createFederatedCredential).toHaveBeenCalledWith(1, 'Google', 'google-id-123');
        expect(result).toEqual(mockCredential);
    });

    it('throws when givenName is missing from the profile', async () => {
        const badProfile = { id: '123', emails: [{ value: 'a@b.com' }], name: {} };

        await expect(createGoogleCredential(badProfile)).rejects.toThrow(
            'Invalid Google profile: Missing given name'
        );
        expect(usersService.createUserWithoutPassword).not.toHaveBeenCalled();
    });

    it('throws when email is missing from the profile', async () => {
        const badProfile = { id: '123', name: { givenName: 'Alice' }, emails: [] };

        await expect(createGoogleCredential(badProfile)).rejects.toThrow(
            'Invalid Google profile: Missing email'
        );
        expect(usersService.createUserWithoutPassword).not.toHaveBeenCalled();
    });

    it('throws a wrapped error when user creation fails', async () => {
        vi.mocked(usersService.createUserWithoutPassword).mockRejectedValue(
            new Error('username taken')
        );

        await expect(createGoogleCredential(mockProfile)).rejects.toThrow(
            'Failed to create user: username taken'
        );
        expect(fedCredRepository.createFederatedCredential).not.toHaveBeenCalled();
    });

    it('throws a wrapped error when storing the credential fails', async () => {
        const mockUser = { id: 1, username: 'Alice' };
        vi.mocked(usersService.createUserWithoutPassword).mockResolvedValue(mockUser);
        vi.mocked(fedCredRepository.createFederatedCredential).mockRejectedValue(
            new Error('duplicate entry')
        );

        await expect(createGoogleCredential(mockProfile)).rejects.toThrow(
            'Failed to store federated credentials: duplicate entry'
        );
    });
});

describe('getGoogleCredential', () => {
    it('fetches the credential by provider and Google subject ID', async () => {
        const mockCredential = { id: 10, user_id: 1, provider: 'Google', subject: 'google-id-123' };
        vi.mocked(fedCredRepository.getFederatedCredential).mockResolvedValue(mockCredential);

        const result = await getGoogleCredential(mockProfile);

        expect(fedCredRepository.getFederatedCredential).toHaveBeenCalledWith('Google', 'google-id-123');
        expect(result).toEqual(mockCredential);
    });

    it('returns undefined when no credential exists', async () => {
        vi.mocked(fedCredRepository.getFederatedCredential).mockResolvedValue(undefined);

        const result = await getGoogleCredential(mockProfile);

        expect(result).toBeUndefined();
    });
});
