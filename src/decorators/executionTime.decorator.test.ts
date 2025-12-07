import { ExecutionTime, ExecutionTimeSync } from './executionTime.decorator';

describe('ExecutionTime Decorator', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('ExecutionTime (async)', () => {
    it('should log execution time for successful async method', async () => {
      class TestClass {
        @ExecutionTime('TestMethod')
        async testMethod(): Promise<string> {
          return 'success';
        }
      }

      const instance = new TestClass();
      const result = await instance.testMethod();

      expect(result).toBe('success');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/⏱️  \[TestMethod\] executed in \d+\.\d+ms/)
      );
    });

    it('should log execution time for failed async method', async () => {
      class TestClass {
        @ExecutionTime('FailingMethod')
        async testMethod(): Promise<string> {
          throw new Error('Test error');
        }
      }

      const instance = new TestClass();
      
      await expect(instance.testMethod()).rejects.toThrow('Test error');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/⏱️  \[FailingMethod\] failed after \d+\.\d+ms/)
      );
    });

    it('should use default label when no label provided', async () => {
      class TestClass {
        @ExecutionTime()
        async myMethod(): Promise<number> {
          return 42;
        }
      }

      const instance = new TestClass();
      await instance.myMethod();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/⏱️  \[TestClass\.myMethod\] executed in \d+\.\d+ms/)
      );
    });
  });

  describe('ExecutionTimeSync', () => {
    it('should log execution time for successful sync method', () => {
      class TestClass {
        @ExecutionTimeSync('SyncMethod')
        testMethod(): string {
          return 'sync success';
        }
      }

      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toBe('sync success');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/⏱️  \[SyncMethod\] executed in \d+\.\d+ms/)
      );
    });

    it('should log execution time for failed sync method', () => {
      class TestClass {
        @ExecutionTimeSync('FailingSyncMethod')
        testMethod(): string {
          throw new Error('Sync error');
        }
      }

      const instance = new TestClass();
      
      expect(() => instance.testMethod()).toThrow('Sync error');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/⏱️  \[FailingSyncMethod\] failed after \d+\.\d+ms/)
      );
    });
  });
});
