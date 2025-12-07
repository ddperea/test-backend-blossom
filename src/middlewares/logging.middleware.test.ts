import { Request, Response, NextFunction } from 'express';
import { loggingMiddleware } from './logging.middleware';

describe('LoggingMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let finishCallback: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    // Silenciar console.log en tests
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Mock del request
    mockRequest = {
      method: 'GET',
      originalUrl: '/graphql',
    };

    // Mock del response con evento 'finish'
    finishCallback = () => {};
    mockResponse = {
      statusCode: 200,
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
        return mockResponse as Response;
      }),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Middleware execution', () => {
    it('should call next() immediately', () => {
      loggingMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should register finish event listener', () => {
      loggingMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });
  });

  describe('Logging on finish', () => {
    it('should log request details when response finishes', () => {
      loggingMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Simular que la respuesta termina
      finishCallback();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] GET \/graphql - .*200.* - \d+ms/)
      );
    });

    it('should log POST method correctly', () => {
      mockRequest.method = 'POST';
      mockRequest.originalUrl = '/api/data';

      loggingMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      finishCallback();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('POST /api/data')
      );
    });

    it('should log 200 status code with green color', () => {
      mockResponse.statusCode = 200;

      loggingMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      finishCallback();

      // Verifica que se usa el color verde (\x1b[32m) para 2xx
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[32m200\x1b[0m')
      );
    });

    it('should log 201 status code with green color', () => {
      mockResponse.statusCode = 201;

      loggingMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      finishCallback();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[32m201\x1b[0m')
      );
    });

    it('should log 400 status code with yellow color', () => {
      mockResponse.statusCode = 400;

      loggingMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      finishCallback();

      // Verifica que se usa el color amarillo (\x1b[33m) para 4xx
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[33m400\x1b[0m')
      );
    });

    it('should log 404 status code with yellow color', () => {
      mockResponse.statusCode = 404;

      loggingMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      finishCallback();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[33m404\x1b[0m')
      );
    });

    it('should log 500 status code with red color', () => {
      mockResponse.statusCode = 500;

      loggingMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      finishCallback();

      // Verifica que se usa el color rojo (\x1b[31m) para 5xx
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[31m500\x1b[0m')
      );
    });

    it('should log 503 status code with red color', () => {
      mockResponse.statusCode = 503;

      loggingMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      finishCallback();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[31m503\x1b[0m')
      );
    });

    it('should include execution duration in milliseconds', () => {
      loggingMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      finishCallback();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\d+ms$/)
      );
    });

    it('should include ISO timestamp', () => {
      loggingMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      finishCallback();

      // Verifica formato ISO: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]/)
      );
    });
  });

  describe('Different HTTP methods', () => {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

    methods.forEach((method) => {
      it(`should log ${method} method correctly`, () => {
        mockRequest.method = method;

        loggingMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        finishCallback();

        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining(method)
        );
      });
    });
  });

  describe('Different URL paths', () => {
    const paths = ['/graphql', '/health', '/api-docs', '/api/v1/users', '/'];

    paths.forEach((path) => {
      it(`should log path ${path} correctly`, () => {
        mockRequest.originalUrl = path;

        loggingMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        finishCallback();

        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining(path)
        );
      });
    });
  });
});
