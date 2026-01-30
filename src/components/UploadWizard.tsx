import React, { useState } from 'react';
// Note: This component is a placeholder for future Supabase integration
// Currently the app uses localStorage via the CatalogContext

interface UploadWizardProps {
  catalogId: string;
}

export const UploadWizard: React.FC<UploadWizardProps> = ({ catalogId }) => {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="p-6 bg-card text-foreground rounded-lg shadow-xl border border-border">
      <h2 className="text-2xl font-bold mb-4 font-mono text-primary">Upload Catalog Data</h2>

      <div className="space-y-4">
        <div className="p-4 bg-muted/20 rounded-lg border border-border text-muted-foreground text-center">
          <p>Este componente requiere Lovable Cloud para funcionar.</p>
          <p className="text-sm mt-2">Actualmente los catálogos se suben desde /admin/upload</p>
        </div>

        {status && (
          <div className="p-3 bg-muted rounded border border-border text-primary animate-pulse">
            {status}
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 rounded border border-destructive text-destructive">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};
