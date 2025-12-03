
"use client";

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationScrollIcon } from 'hugeicons-react';
import { useChatStore } from '@/hooks/use-chat-store';

export function StatCards() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Safely handle auth state
        try {
            if (auth && typeof auth.onAuthStateChanged === 'function') {
                const unsubscribe = auth.onAuthStateChanged(
                    (user) => {
                        setUser(user);
                        setLoading(false);
                    },
                    (error) => {
                        console.warn("Auth state error in stat cards (offline mode):", error);
                        setUser(null);
                        setLoading(false);
                    }
                );
                return unsubscribe;
            } else {
                // Mock auth - no user
                setUser(null);
                setLoading(false);
            }
        } catch (authError) {
            console.warn("Auth initialization error in stat cards (offline mode):", authError);
            setUser(null);
            setLoading(false);
        }
    }, []);
    
    const { chats } = useChatStore();
    
    const yourClassesCount = Object.keys(chats).filter(c => c !== 'general-chat').length;
    
    const statCards = [
        { title: "Your Classes", value: yourClassesCount, icon: <GraduationScrollIcon className="text-primary" />, loading: !user },
    ];

    if (!user) {
        return (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-6 w-6 rounded-full" />
                        </CardHeader>
                        <CardContent>
                             <Skeleton className="h-8 w-1/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
            {statCards.map(card => (
                <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <div className="h-6 w-6">{card.icon}</div>
                    </CardHeader>
                    <CardContent>
                        {card.loading ? (
                            <Skeleton className="h-8 w-12" />
                        ): (
                            <div className="text-2xl font-bold">{card.value ?? 0}</div>
                        )}
                    </CardContent>
                </Card>
            ))}
      </div>
    )
}
