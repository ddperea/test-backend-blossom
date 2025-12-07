import SyncCharactersJob from './syncCharacters.job';
import rickMortyApiClient from '../services/rickMortyApi.client';
import characterService from '../services/character.service';
import cron from 'node-cron';

// Mock de node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({
    stop: jest.fn(),
  })),
}));

// Mock del rick morty api client
jest.mock('../services/rickMortyApi.client', () => ({
  getCharactersForDb: jest.fn(),
}));

// Mock del character service
jest.mock('../services/character.service', () => ({
  syncCharacters: jest.fn(),
}));

describe('SyncCharactersJob', () => {
  // Mock data
  const mockCharacters = [
    { name: 'Rick Sanchez', status: 'Alive', species: 'Human' },
    { name: 'Morty Smith', status: 'Alive', species: 'Human' },
  ];

  const mockSyncedCharacters = [
    { id: 1, ...mockCharacters[0] },
    { id: 2, ...mockCharacters[1] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Silenciar console.log y console.error en tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset del job (accedemos a la propiedad privada para resetear el estado)
    (SyncCharactersJob as any).job = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Asegurar que el job se detenga después de cada test
    SyncCharactersJob.stop();
  });

  describe('start', () => {
    it('should start the cron job with correct expression', () => {
      SyncCharactersJob.start();

      expect(cron.schedule).toHaveBeenCalledWith(
        '0 */12 * * *',
        expect.any(Function)
      );
    });

    it('should not start if already running', () => {
      SyncCharactersJob.start();
      SyncCharactersJob.start(); // Intentar iniciar de nuevo

      // Solo debe haber sido llamado una vez
      expect(cron.schedule).toHaveBeenCalledTimes(1);
    });

    it('should log warning when job already running', () => {
      SyncCharactersJob.start();
      SyncCharactersJob.start();

      expect(console.log).toHaveBeenCalledWith('⚠️  Sync job already running');
    });
  });

  describe('stop', () => {
    it('should stop the cron job when running', () => {
      const mockStop = jest.fn();
      (cron.schedule as jest.Mock).mockReturnValue({ stop: mockStop });

      SyncCharactersJob.start();
      SyncCharactersJob.stop();

      expect(mockStop).toHaveBeenCalledTimes(1);
    });

    it('should do nothing when job is not running', () => {
      // No debería lanzar error
      expect(() => SyncCharactersJob.stop()).not.toThrow();
    });

    it('should log message when stopping', () => {
      const mockStop = jest.fn();
      (cron.schedule as jest.Mock).mockReturnValue({ stop: mockStop });

      SyncCharactersJob.start();
      SyncCharactersJob.stop();

      expect(console.log).toHaveBeenCalledWith('🛑 Sync cron job stopped');
    });
  });

  describe('isRunning', () => {
    it('should return false when job is not started', () => {
      expect(SyncCharactersJob.isRunning()).toBe(false);
    });

    it('should return true when job is running', () => {
      SyncCharactersJob.start();

      expect(SyncCharactersJob.isRunning()).toBe(true);
    });

    it('should return false after stopping', () => {
      SyncCharactersJob.start();
      SyncCharactersJob.stop();

      expect(SyncCharactersJob.isRunning()).toBe(false);
    });
  });

  describe('syncNow', () => {
    it('should sync characters successfully', async () => {
      (rickMortyApiClient.getCharactersForDb as jest.Mock).mockResolvedValue(mockCharacters);
      (characterService.syncCharacters as jest.Mock).mockResolvedValue(mockSyncedCharacters);

      await SyncCharactersJob.syncNow();

      expect(rickMortyApiClient.getCharactersForDb).toHaveBeenCalledWith(15);
      expect(characterService.syncCharacters).toHaveBeenCalledWith(mockCharacters);
    });

    it('should log start message with timestamp', async () => {
      (rickMortyApiClient.getCharactersForDb as jest.Mock).mockResolvedValue(mockCharacters);
      (characterService.syncCharacters as jest.Mock).mockResolvedValue(mockSyncedCharacters);

      await SyncCharactersJob.syncNow();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Starting character sync...')
      );
    });

    it('should log success message with count and duration', async () => {
      (rickMortyApiClient.getCharactersForDb as jest.Mock).mockResolvedValue(mockCharacters);
      (characterService.syncCharacters as jest.Mock).mockResolvedValue(mockSyncedCharacters);

      await SyncCharactersJob.syncNow();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Synced 2 characters')
      );
    });

    it('should handle API errors gracefully', async () => {
      (rickMortyApiClient.getCharactersForDb as jest.Mock).mockRejectedValue(
        new Error('API connection failed')
      );

      await SyncCharactersJob.syncNow();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Sync failed:'),
        'API connection failed'
      );
    });

    it('should handle service errors gracefully', async () => {
      (rickMortyApiClient.getCharactersForDb as jest.Mock).mockResolvedValue(mockCharacters);
      (characterService.syncCharacters as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await SyncCharactersJob.syncNow();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Sync failed:'),
        'Database error'
      );
    });

    it('should handle empty characters array', async () => {
      (rickMortyApiClient.getCharactersForDb as jest.Mock).mockResolvedValue([]);
      (characterService.syncCharacters as jest.Mock).mockResolvedValue([]);

      await SyncCharactersJob.syncNow();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Synced 0 characters')
      );
    });
  });

  describe('Cron Callback Execution', () => {
    it('should execute syncNow when cron triggers', async () => {
      let cronCallback: () => Promise<void> = async () => {};
      (cron.schedule as jest.Mock).mockImplementation((expression, callback) => {
        cronCallback = callback;
        return { stop: jest.fn() };
      });

      (rickMortyApiClient.getCharactersForDb as jest.Mock).mockResolvedValue(mockCharacters);
      (characterService.syncCharacters as jest.Mock).mockResolvedValue(mockSyncedCharacters);

      SyncCharactersJob.start();
      
      // Simular ejecución del cron
      await cronCallback();

      expect(rickMortyApiClient.getCharactersForDb).toHaveBeenCalled();
      expect(characterService.syncCharacters).toHaveBeenCalled();
    });
  });
});
