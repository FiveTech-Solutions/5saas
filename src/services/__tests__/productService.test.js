import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts, createProduct } from '../productService';
import { supabase } from '../supabase';

// Mock Supabase client
vi.mock('../supabase', () => ({
    supabase: {
        from: vi.fn(),
        auth: {
            getUser: vi.fn(),
        },
    },
}));

describe('productService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getProducts', () => {
        it('should fetch products successfully', async () => {
            // Mock chain: from -> select -> eq -> order
            const mockData = [{ id: 1, nome: 'Produto Teste' }];
            const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

            supabase.from.mockReturnValue({
                select: mockSelect,
            });

            const result = await getProducts();

            expect(supabase.from).toHaveBeenCalledWith('products');
            expect(mockSelect).toHaveBeenCalled();
            expect(mockEq).toHaveBeenCalledWith('ativo', true);
            expect(result).toEqual(mockData);
        });

        it('should handle errors when fetching products', async () => {
            const mockError = { message: 'Database error', code: '500' };
            const mockOrder = vi.fn().mockResolvedValue({ data: null, error: mockError });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

            supabase.from.mockReturnValue({
                select: mockSelect,
            });

            await expect(getProducts()).rejects.toThrow('Database error');
        });
    });
});
