import { vi, test, expect, describe } from "vitest";
import db from "../../db-users/index.js";
import {
    createFederatedCredential,
    getFederatedCredential,
    updateFederatedCredential,
    deleteFederatedCredential
} from "../../repositories/fedCredRepository.js";

vi.mock('../../db-users/index.js', () => {
    return {
        default: { query: vi.fn() },
        query: vi.fn(),
    };
});

describe("createFederatedCredential", () => {
    it("should insert a credential and return its data", async () => {
        const mockCredential = { id: 1, user_id: 1, provider: "google", subject: "12345" };
        vi.mocked(db.query).mockResolvedValueOnce({ rows: [mockCredential] });

        const result = await createFederatedCredential(1, "google", "12345");

        expect(result).toEqual(mockCredential);
    });
});

describe("getFederatedCredential", () => {
    it("should retrieve a credential by its provider and subject", async () => {
        const mockCredential = { id: 1, user_id: 1, provider: "google", subject: "12345" };
        vi.mocked(db.query).mockResolvedValueOnce({ rows: [mockCredential] });

        const result = await getFederatedCredential("google", "12345");

        expect(result).toEqual(mockCredential);
    });
});

describe("updateFederatedCredential", () => {
    it("should update fields and returns updated credential", async () => {
        const mockUpdatedCredential = { id: 1, user_id: 2, provider: "github", subject: "67890" };
        db.query.mockResolvedValue({ rows: [mockUpdatedCredential] });

        const result = await updateFederatedCredential(1, 2, "github", "67890");

        expect(result).toEqual(mockUpdatedCredential);
    });
});

describe("deleteFederatedCredential", () => {
    it("should remove a credential and returns deleted data", async () => {
        const mockDeletedCredential = { id: 1, user_id: 1, provider: "google", subject: "12345" };
        db.query.mockResolvedValue({ rows: [mockDeletedCredential] });

        const result = await deleteFederatedCredential(1);

        expect(result).toEqual(mockDeletedCredential);
    });
});
