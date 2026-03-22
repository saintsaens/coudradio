import { vi, expect } from "vitest";
import * as usersRepository from "../../repositories/usersRepository.js";
import * as connectionTracker from "../../loaders/connectionTracker.js";
import { getUserById, updateUser, deleteUser, createUserWithoutPassword, addTimeSpent, getListenerCounts, getUserRankAndTotal } from "../../services/usersService.js";

// Mock usersRepository and bcrypt
vi.mock("../../repositories/usersRepository.js", () => ({
  createUser: vi.fn(),
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  addTimeSpent: vi.fn(),
  getActiveAuthenticatedCount: vi.fn(),
  getUserRankAndTotal: vi.fn(),
}));

vi.mock("../../loaders/connectionTracker.js", () => ({
  getRecentConnectionCount: vi.fn(),
}));

describe("getUserById", () => {
  it("should fetch a user and return its properties", async () => {
    const mockUser = { id: 1, username: "testuser" };
    usersRepository.getUserById.mockResolvedValueOnce(mockUser);
  
    const result = await getUserById(1);
  
    expect(usersRepository.getUserById).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockUser);
  });
});

describe("updateUser", () => {
  it("should update user and return the result", async () => {
    const mockUser = { id: 1, username: "updateduser", role: "user", session_start_time: "2025-02-10T10:00:00Z", last_activity_time: "2025-02-10T10:00:00Z" };
    usersRepository.updateUser.mockResolvedValueOnce(mockUser);

    const result = await updateUser(1, {
      username: "updateduser",
      role: "user",
      sessionStartTime: "2025-02-10T10:00:00Z",
      lastActivityTime: "2025-02-10T10:00:00Z",
    });

    expect(usersRepository.updateUser).toHaveBeenCalledWith(1, {
      username: "updateduser",
      role: "user",
      sessionStartTime: "2025-02-10T10:00:00Z",
      lastActivityTime: "2025-02-10T10:00:00Z",
    });
    expect(result).toEqual(mockUser);
  });
});

describe("deleteUser", () => {
  it("should remove a user and return its former properties", async () => {
    const mockUser = { id: 1, username: "deleteduser" };
    usersRepository.deleteUser.mockResolvedValueOnce(mockUser);

    const result = await deleteUser(1);

    expect(usersRepository.deleteUser).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockUser);
  });
});

describe("createUserWithoutPassword", () => {
  it("throws when username is missing", async () => {
    await expect(createUserWithoutPassword(null, "a@b.com")).rejects.toThrow(
      "Username and email are required"
    );
  });

  it("throws when email is missing", async () => {
    await expect(createUserWithoutPassword("alice", null)).rejects.toThrow(
      "Username and email are required"
    );
  });

  it("calls createUser with hashedPw=null and returns the created user", async () => {
    const mockUser = { id: 5, username: "alice" };
    usersRepository.createUser.mockResolvedValueOnce(mockUser);

    const result = await createUserWithoutPassword("alice", "alice@example.com");

    expect(usersRepository.createUser).toHaveBeenCalledWith(
      "alice",
      null,
      "user",
      expect.any(Date),
      expect.any(Date),
      0,
      false,
      "alice@example.com"
    );
    expect(result).toEqual(mockUser);
  });
});

describe("addTimeSpent", () => {
  it("delegates to usersRepository.addTimeSpent and returns the result", async () => {
    const mockUser = { id: 1, time_spent: 30 };
    usersRepository.addTimeSpent.mockResolvedValueOnce(mockUser);

    const result = await addTimeSpent(1, 20);

    expect(usersRepository.addTimeSpent).toHaveBeenCalledWith(1, 20);
    expect(result).toEqual(mockUser);
  });
});

describe("getListenerCounts", () => {
  it("returns authenticated count and anonymous count (total minus authenticated)", async () => {
    usersRepository.getActiveAuthenticatedCount.mockResolvedValueOnce(3);
    connectionTracker.getRecentConnectionCount.mockReturnValueOnce(7);

    const result = await getListenerCounts();

    expect(result).toEqual({ authenticated: 3, anonymous: 4 });
  });

  it("clamps anonymous to 0 when authenticated count exceeds total connections", async () => {
    usersRepository.getActiveAuthenticatedCount.mockResolvedValueOnce(10);
    connectionTracker.getRecentConnectionCount.mockReturnValueOnce(5);

    const result = await getListenerCounts();

    expect(result).toEqual({ authenticated: 10, anonymous: 0 });
  });
});

describe("getUserRankAndTotal", () => {
  it("returns rank and total when the user is found", async () => {
    const rankRow = { rank: 2, total: 10 };
    usersRepository.getUserRankAndTotal.mockResolvedValueOnce(rankRow);

    const result = await getUserRankAndTotal(1);

    expect(result).toEqual(rankRow);
  });

  it("throws 'User not found' when the repository returns undefined", async () => {
    usersRepository.getUserRankAndTotal.mockResolvedValueOnce(undefined);

    await expect(getUserRankAndTotal(999)).rejects.toThrow("User not found");
  });
});
