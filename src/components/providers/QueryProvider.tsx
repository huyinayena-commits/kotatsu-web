'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Stale time: 5 minutes (data dianggap fresh)
                        staleTime: 5 * 60 * 1000,
                        // Cache time: 30 minutes
                        gcTime: 30 * 60 * 1000,
                        // Retry failed requests 2 times
                        retry: 2,
                        // Refetch on window focus
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
