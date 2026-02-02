import { PriceFilterPipe } from './price-filter.pipe';

describe('PriceFilterPipe', () => {
  let pipe: PriceFilterPipe;

  beforeEach(() => {
    pipe = new PriceFilterPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format number with 2 decimal places', () => {
    // The pipe uses European format with comma as decimal separator
    expect(pipe.transform(100)).toBe('100,00');
    expect(pipe.transform(99.9)).toBe('99,90');
    expect(pipe.transform(1234.567)).toBe('1234,57');
  });

  it('should handle zero', () => {
    expect(pipe.transform(0)).toBe('0,00');
  });

  it('should handle negative numbers', () => {
    expect(pipe.transform(-50)).toBe('-50,00');
    expect(pipe.transform(-99.99)).toBe('-99,99');
  });

  it('should handle large numbers', () => {
    expect(pipe.transform(1000000)).toBe('1000000,00');
    expect(pipe.transform(999999.99)).toBe('999999,99');
  });

  it('should round correctly', () => {
    expect(pipe.transform(10.125)).toBe('10,13');
    expect(pipe.transform(10.124)).toBe('10,12');
  });

  it('should handle null/undefined gracefully', () => {
    expect(pipe.transform(null as any)).toBe('0,00');
    expect(pipe.transform(undefined as any)).toBe('0,00');
  });

  it('should handle string numbers', () => {
    expect(pipe.transform('100' as any)).toBe('100,00');
    expect(pipe.transform('99.50' as any)).toBe('99,50');
  });
});
