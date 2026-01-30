
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone'; // Assuming usage of react-dropzone or standard input
import { supabase } from '@/lib/supabase';
import { parseExcelFile, ProductInsert } from '@/utils/excelParser';

// Strictly matching the 'products' table schema
// id: uuid (auto-gen)
// catalog_id: uuid
// model: text
// brand: text
// price: numeric
// specs: jsonb
// image_url: text
// active: boolean

interface Product extends ProductInsert {
    catalog_id: string; // Foreign key
}

export const UploadWizard: React.FC<{ catalogId: string }> = ({ catalogId }) => {
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setStatus('Parsing Excel file...');
        setError(null);

        try {
            // 1. Parse File
            const { products: parsedProducts, errors } = await parseExcelFile(file);

            if (errors.length > 0) {
                // Maybe warn but continue? For now let's just log
                console.warn('Parse warnings:', errors);
            }

            if (parsedProducts.length === 0) {
                throw new Error('No products found in Excel file');
            }

            setStatus(`Found ${parsedProducts.length} products. Uploading to database...`);

            // 2. Prepare for Insert
            // Map to exact DB columns (snake_case)
            const productsToInsert: Product[] = parsedProducts.map(p => ({
                catalog_id: catalogId,
                model: p.model,
                brand: p.brand,
                price: p.price,
                specs: p.specs,
                image_url: p.image_url,
                active: p.active
            }));

            // 3. Insert into Supabase
            const { error: insertError } = await supabase
                .from('products')
                .insert(productsToInsert);

            if (insertError) {
                throw insertError;
            }

            setStatus('Upload successful!');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to upload products');
            setStatus('');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 font-mono text-cyan-400">Upload Catalog Data</h2>

            <div className="space-y-4">
                <label className="block">
                    <span className="block text-sm font-medium mb-2 text-gray-300">Select Excel File (.xlsx)</span>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-cyan-900 file:text-cyan-300
              hover:file:bg-cyan-800
              disabled:opacity-50 cursor-pointer"
                    />
                </label>

                {status && (
                    <div className="p-3 bg-gray-800 rounded border border-gray-600 text-cyan-200 animate-pulse">
                        {status}
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-900/50 rounded border border-red-500 text-red-200">
                        Error: {error}
                    </div>
                )}
            </div>
        </div>
    );
};
