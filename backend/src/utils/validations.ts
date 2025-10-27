export class Validator {
  static isValidUsername(username: string): { valid: boolean; error?: string } {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username is required' };
    }

    const trimmed = username.trim();

    if (trimmed.length === 0) {
      return { valid: false, error: 'Username cannot be empty' };
    }

    if (trimmed.length < 2) {
      return { valid: false, error: 'Username must be at least 2 characters' };
    }

    if (trimmed.length > 20) {
      return { valid: false, error: 'Username must be less than 20 characters' };
    }

    // Allow alphanumeric, spaces, underscores, and hyphens
    const usernameRegex = /^[a-zA-Z0-9\s_-]+$/;
    if (!usernameRegex.test(trimmed)) {
      return { valid: false, error: 'Username can only contain letters, numbers, spaces, underscores, and hyphens' };
    }

    return { valid: true };
  }

  static isValidColumn(column: number, maxColumns: number = 7): { valid: boolean; error?: string } {
    if (typeof column !== 'number') {
      return { valid: false, error: 'Column must be a number' };
    }

    if (!Number.isInteger(column)) {
      return { valid: false, error: 'Column must be an integer' };
    }

    if (column < 0 || column >= maxColumns) {
      return { valid: false, error: `Column must be between 0 and ${maxColumns - 1}` };
    }

    return { valid: true };
  }

  static isValidGameId(gameId: string): { valid: boolean; error?: string } {
    if (!gameId || typeof gameId !== 'string') {
      return { valid: false, error: 'Game ID is required' };
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(gameId)) {
      return { valid: false, error: 'Invalid game ID format' };
    }

    return { valid: true };
  }

  static sanitizeUsername(username: string): string {
    return username.trim().substring(0, 20);
  }
}