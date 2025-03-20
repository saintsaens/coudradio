import { vi, test, expect } from "vitest";
import db from "../../db-users/index.js";
import { createUser, getUserById, updateUser, deleteUser } from "../../repositories/usersRepository.js";

const mockUser = {
  id: 1,
  username: "testuser",
  hashed_pw: "hashedpassword",
  role: "user",
  session_start_time: "2025-02-10T10:00:00Z",
  last_activity_time: "2025-02-10T10:00:00Z",
  time_spent: 10,
  subscribed: false,
  email: "testuser@test.com"
};

vi.mock('../../db-users/index.js', () => {
  return {
    default: { query: vi.fn() },
    query: vi.fn(),
  };
});

describe("createUser", () => {
  it("should create a user and return all its non-password fields", async () => {
    const newUsername = "testuser";
    const newHashedPassword = "hashedpassword";
    const newRole = "user";
    const newSessionStartTime = "2025-02-10T10:00:00Z";
    const newLastActivityTime = "2025-02-10T10:00:00Z";
    const newTimeSpent = 0;
    const newSubscribed = false;
    const newEmail = "testuser@test.com";
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [mockUser] });

    const result = await createUser(
      newUsername,
      newHashedPassword,
      newRole,
      newSessionStartTime,
      newLastActivityTime,
      newTimeSpent,
      newSubscribed,
      newEmail
    );

    expect(result).toEqual(mockUser);
  });
  it("should throw an error if a field is missing", async () => {
    const newUsername = "testuser";
    const newHashedPassword = "hashedpassword";
    const newRole = "user";
    const newSessionStartTime = "2025-02-10T10:00:00Z";
    const newLastActivityTime = "2025-02-10T10:00:00Z";
    const newTimeSpent = 0;
    const newSubscribed = false;
    // `newEmail` is missing

    await expect(
      createUser(
        newUsername,
        newHashedPassword,
        newRole,
        newSessionStartTime,
        newLastActivityTime,
        newTimeSpent,
        newSubscribed
      )
    ).rejects.toThrow("Missing required argument in createUser");
  });
});

describe("getUserById", () => {
  it("should retrieve a user by its ID with session data", async () => {
    const userId = 1;
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [mockUser] });

    const result = await getUserById(userId);

    expect(result).toEqual(mockUser);
  });
});

describe("updateUser", () => {
  it("should update user fields and return the updated user", async () => {
    const userId = 1;
    const updatedUser = {
      id: 1,
      username: "testuser",
      role: "user",
      session_start_time: "2025-03-10T10:00:00Z",
      last_activity_time: "2025-02-10T10:00:00Z",
    };
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [updatedUser] });

    const result = await updateUser(userId, { sessionStartTime: "2025-03-10T10:00:00Z" });

    expect(result).toEqual(updatedUser);
  });
});

describe("deleteUser", () => {
  it("should delete a user and return its former data with session info", async () => {
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [mockUser] });

    const result = await deleteUser(1);

    expect(result).toEqual(mockUser);
  });
});
