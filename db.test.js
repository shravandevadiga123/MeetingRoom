// db.test.js
// Mock mysql2
jest.mock('mysql2', () => ({
  createPool: jest.fn().mockReturnValue({
    promise: jest.fn().mockReturnValue({
      getConnection: jest.fn().mockResolvedValue({
        release: jest.fn() // Mock connection release
      })
    })
  })
}));

// Must require db AFTER mocking mysql2
const pool = require('./db');

describe('Database Configuration', () => {
  test('should create a pool with correct configuration', () => {
    // Assert that createPool was called with the right config
    expect(require('mysql2').createPool).toHaveBeenCalledWith({
      host: 'host.docker.internal',
      user: 'root',
      password: '',
      database: 'meeting_room_booking',
      port: 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  });

  test('should export a promise-based pool', () => {
    // Verify the pool is exported (mocked)
    expect(pool).toBeTruthy();
    expect(pool.getConnection).toBeDefined();
  });

  test('should be able to get a connection', async () => {
    const connection = await pool.getConnection();
    expect(connection).toBeTruthy();
    expect(connection.release).toBeDefined();
    connection.release();
  });
});
