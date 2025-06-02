import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SimpleDeduplicationService } from './simple-deduplication.service';

describe('SimpleDeduplicationService', () => {
  let service: SimpleDeduplicationService;
  let mockCacheManager: any;

  // Mock cache data
  const mockCache = new Map<string, any>();

  beforeEach(async () => {
    // Reset mock cache before each test
    mockCache.clear();

    // Create mock cache manager
    mockCacheManager = {
      get: jest.fn().mockImplementation((key: string) => {
        return Promise.resolve(mockCache.get(key));
      }),
      set: jest.fn().mockImplementation((key: string, value: any, ttl?: number) => {
        mockCache.set(key, value);
        return Promise.resolve();
      }),
      del: jest.fn().mockImplementation((key: string) => {
        mockCache.delete(key);
        return Promise.resolve();
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimpleDeduplicationService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<SimpleDeduplicationService>(SimpleDeduplicationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processOnce', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should process a new request and cache the result', async () => {
      const key = 'test_key_1';
      const expectedResult = { data: 'test_data', id: 123 };
      
      const mockProcessFn = jest.fn().mockResolvedValue(expectedResult);

      const result = await service.processOnce(key, mockProcessFn, 300);

      expect(result).toEqual(expectedResult);
      expect(mockProcessFn).toHaveBeenCalledTimes(1);
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(mockCacheManager.set).toHaveBeenCalledWith(`processing:${key}`, true, 60);
      expect(mockCacheManager.set).toHaveBeenCalledWith(key, expectedResult, 300);
      expect(mockCacheManager.del).toHaveBeenCalledWith(`processing:${key}`);
    });

    it('should return cached result for duplicate request', async () => {
      const key = 'test_key_2';
      const cachedResult = { data: 'cached_data', id: 456 };
      
      // Pre-populate cache
      mockCache.set(key, cachedResult);
      
      const mockProcessFn = jest.fn();

      const result = await service.processOnce(key, mockProcessFn, 300);

      expect(result).toEqual(cachedResult);
      expect(mockProcessFn).not.toHaveBeenCalled();
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(mockCacheManager.set).not.toHaveBeenCalledWith(key, expect.anything(), expect.anything());
    });

    it('should return null for concurrent request (already processing)', async () => {
      const key = 'test_key_3';
      const processingKey = `processing:${key}`;
      
      // Mark as currently processing
      mockCache.set(processingKey, true);
      
      const mockProcessFn = jest.fn();

      const result = await service.processOnce(key, mockProcessFn, 300);

      expect(result).toBeNull();
      expect(mockProcessFn).not.toHaveBeenCalled();
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(mockCacheManager.get).toHaveBeenCalledWith(processingKey);
    });

    it('should handle processing function errors and clean up', async () => {
      const key = 'test_key_4';
      const error = new Error('Processing failed');
      
      const mockProcessFn = jest.fn().mockRejectedValue(error);

      await expect(service.processOnce(key, mockProcessFn, 300)).rejects.toThrow('Processing failed');

      expect(mockProcessFn).toHaveBeenCalledTimes(1);
      expect(mockCacheManager.set).toHaveBeenCalledWith(`processing:${key}`, true, 60);
      expect(mockCacheManager.del).toHaveBeenCalledWith(`processing:${key}`);
      expect(mockCacheManager.set).not.toHaveBeenCalledWith(key, expect.anything(), 300);
    });

    it('should use custom TTL when provided', async () => {
      const key = 'test_key_5';
      const customTtl = 600;
      const expectedResult = { data: 'custom_ttl_data' };
      
      const mockProcessFn = jest.fn().mockResolvedValue(expectedResult);

      const result = await service.processOnce(key, mockProcessFn, customTtl);

      expect(result).toEqual(expectedResult);
      expect(mockCacheManager.set).toHaveBeenCalledWith(key, expectedResult, customTtl);
    });

    it('should handle multiple different keys independently', async () => {
      const key1 = 'test_key_6a';
      const key2 = 'test_key_6b';
      const result1 = { data: 'data1' };
      const result2 = { data: 'data2' };
      
      const mockProcessFn1 = jest.fn().mockResolvedValue(result1);
      const mockProcessFn2 = jest.fn().mockResolvedValue(result2);

      const [actualResult1, actualResult2] = await Promise.all([
        service.processOnce(key1, mockProcessFn1, 300),
        service.processOnce(key2, mockProcessFn2, 300),
      ]);

      expect(actualResult1).toEqual(result1);
      expect(actualResult2).toEqual(result2);
      expect(mockProcessFn1).toHaveBeenCalledTimes(1);
      expect(mockProcessFn2).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMetrics', () => {
    beforeEach(() => {
      // Reset metrics before each test
      service.resetMetrics();
    });

    it('should return initial metrics', () => {
      const metrics = service.getMetrics();

      expect(metrics).toEqual({
        totalRequests: 0,
        cacheHits: 0,
        duplicateBlocked: 0,
        processed: 0,
        deduplicationRate: '0.00%',
        timestamp: expect.any(String),
      });
    });

    it('should update metrics after processing requests', async () => {
      const key = 'metrics_test_1';
      const mockProcessFn = jest.fn().mockResolvedValue({ data: 'test' });

      // Process a new request
      await service.processOnce(key, mockProcessFn, 300);

      const metrics = service.getMetrics();

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.processed).toBe(1);
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.duplicateBlocked).toBe(0);
      expect(metrics.deduplicationRate).toBe('0.00%');
    });

    it('should track cache hits correctly', async () => {
      const key = 'metrics_test_2';
      const cachedResult = { data: 'cached' };
      const mockProcessFn = jest.fn();

      // Pre-populate cache
      mockCache.set(key, cachedResult);

      // Make request that should hit cache
      await service.processOnce(key, mockProcessFn, 300);

      const metrics = service.getMetrics();

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.processed).toBe(0);
      expect(metrics.duplicateBlocked).toBe(0);
      expect(metrics.deduplicationRate).toBe('100.00%');
    });

    it('should track duplicate blocked correctly', async () => {
      const key = 'metrics_test_3';
      const processingKey = `processing:${key}`;
      const mockProcessFn = jest.fn();

      // Mark as currently processing
      mockCache.set(processingKey, true);

      // Make request that should be blocked
      await service.processOnce(key, mockProcessFn, 300);

      const metrics = service.getMetrics();

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.processed).toBe(0);
      expect(metrics.duplicateBlocked).toBe(1);
      expect(metrics.deduplicationRate).toBe('100.00%');
    });

    it('should calculate deduplication rate correctly with mixed requests', async () => {
      const mockProcessFn = jest.fn().mockResolvedValue({ data: 'test' });

      // Process new request
      await service.processOnce('key1', mockProcessFn, 300);

      // Hit cache
      mockCache.set('key2', { data: 'cached' });
      await service.processOnce('key2', jest.fn(), 300);

      // Block duplicate
      mockCache.set('processing:key3', true);
      await service.processOnce('key3', jest.fn(), 300);

      // Process another new request
      await service.processOnce('key4', mockProcessFn, 300);

      const metrics = service.getMetrics();

      expect(metrics.totalRequests).toBe(4);
      expect(metrics.processed).toBe(2);
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.duplicateBlocked).toBe(1);
      expect(metrics.deduplicationRate).toBe('50.00%'); // (1+1)/4 * 100
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics to zero', async () => {
      const mockProcessFn = jest.fn().mockResolvedValue({ data: 'test' });

      // Generate some metrics
      await service.processOnce('reset_test_1', mockProcessFn, 300);
      mockCache.set('reset_test_2', { data: 'cached' });
      await service.processOnce('reset_test_2', jest.fn(), 300);

      // Verify metrics exist
      let metrics = service.getMetrics();
      expect(metrics.totalRequests).toBeGreaterThan(0);

      // Reset metrics
      service.resetMetrics();

      // Verify metrics are reset
      metrics = service.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.duplicateBlocked).toBe(0);
      expect(metrics.processed).toBe(0);
      expect(metrics.deduplicationRate).toBe('0.00%');
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid concurrent requests correctly', async () => {
      const key = 'concurrent_test';
      const expectedResult = { data: 'concurrent_data' };
      let processCallCount = 0;

      const mockProcessFn = jest.fn().mockImplementation(async () => {
        processCallCount++;
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 10));
        return expectedResult;
      });

      // Simulate 5 rapid concurrent requests for the same key
      const promises = Array(5).fill(null).map(() => 
        service.processOnce(key, mockProcessFn, 300)
      );

      const results = await Promise.all(promises);

      // Only one should process, others should be null (blocked) or return cached result
      const nonNullResults = results.filter(r => r !== null);
      const nullResults = results.filter(r => r === null);

      expect(nonNullResults.length).toBeGreaterThan(0);
      expect(processCallCount).toBe(1); // Only processed once
      
      const metrics = service.getMetrics();
      expect(metrics.totalRequests).toBe(5);
      expect(metrics.processed).toBe(1);
    });

    it('should handle order processing scenario', async () => {
      const shopId = 'shop123';
      const orderId = 'order456';
      const key = `order_details_${shopId}_${orderId}`;
      
      const orderData = {
        orders: [{ id: orderId, shop_id: shopId, status: 'completed' }],
        shop: { id: shopId, name: 'Test Shop' }
      };

      const mockTikTokApiCall = jest.fn().mockResolvedValue(orderData);

      // First call - should process
      const result1 = await service.processOnce(key, mockTikTokApiCall, 300);
      expect(result1).toEqual(orderData);
      expect(mockTikTokApiCall).toHaveBeenCalledTimes(1);

      // Second call - should return cached result
      const result2 = await service.processOnce(key, mockTikTokApiCall, 300);
      expect(result2).toEqual(orderData);
      expect(mockTikTokApiCall).toHaveBeenCalledTimes(1); // Still only called once

      const metrics = service.getMetrics();
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.processed).toBe(1);
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.deduplicationRate).toBe('50.00%');
    });
  });
});
