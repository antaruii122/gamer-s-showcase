
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Interface matching the DB schema we inspected
interface Product {
    id: string;
    model: string;
    brand: string;
    price: number | null;
    image_url: string | null;
    active: boolean;
    // We can include specs if needed, but for the dashboard table, maybe just these are enough
}

// Fetch function
const fetchProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('id, model, brand, price, image_url, active')
        .order('model', { ascending: true });

    if (error) {
        throw error;
    }

    return data || [];
};

// Update function
const updateProductPrice = async ({ id, price }: { id: string; price: number }) => {
    const { error } = await supabase
        .from('products')
        .update({ price })
        .eq('id', id);

    if (error) {
        throw error;
    }
};

export const AdminDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState<string>('');

    // Q: Fetch Data
    const { data: products, isLoading, error } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
    });

    // M: Update Price
    const mutation = useMutation({
        mutationFn: updateProductPrice,
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setEditingId(null);
            setEditPrice('');
        },
        onError: (err: any) => {
            alert(`Error updating price: ${err.message}`);
        }
    });

    const handleEditClick = (product: Product) => {
        setEditingId(product.id);
        setEditPrice(product.price?.toString() || '');
    };

    const handleSaveClick = (id: string) => {
        const newPrice = parseFloat(editPrice);
        if (!isNaN(newPrice)) {
            mutation.mutate({ id, price: newPrice });
        }
    };

    const handleCancelClick = () => {
        setEditingId(null);
        setEditPrice('');
    };

    if (isLoading) return <div className="p-10 text-center text-cyan-400">Loading products...</div>;
    if (error) return <div className="p-10 text-center text-red-400">Error loading data</div>;

    return (
        <div className="p-6 bg-gray-950 text-white min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold font-mono text-cyan-400">Admin Dashboard</h1>
                <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-cyan-300 border border-gray-700 transition-colors"
                >
                    Refresh Data
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-800 shadow-xl">
                <table className="min-w-full divide-y divide-gray-800 bg-gray-900">
                    <thead className="bg-gray-950">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Image</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Model</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Brand</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price (USD)</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {products?.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.model}
                                            className="h-10 w-10 rounded object-cover border border-gray-700"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-gray-500">
                                            No Img
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                    {product.model}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {product.brand}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300 font-mono">
                                    {editingId === product.id ? (
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-24 bg-gray-950 border border-cyan-500 rounded px-2 py-1 text-white focus:outline-none"
                                            value={editPrice}
                                            onChange={(e) => setEditPrice(e.target.value)}
                                            autoFocus
                                        />
                                    ) : (
                                        product.price !== null ? `$${product.price.toFixed(2)}` : '-'
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.active ? 'bg-green-900/30 text-green-300 border border-green-800' : 'bg-red-900/30 text-red-300 border border-red-800'
                                        }`}>
                                        {product.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    {editingId === product.id ? (
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleSaveClick(product.id)}
                                                className="text-green-400 hover:text-green-300 font-bold"
                                                disabled={mutation.isPending}
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancelClick}
                                                className="text-gray-500 hover:text-gray-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEditClick(product)}
                                            className="text-cyan-500 hover:text-cyan-300 font-medium"
                                        >
                                            Edit Price
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {products?.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                    No products found. Start by uploading a catalog.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
