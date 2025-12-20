'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface WaitlistItem {
  id: string;
  email: string;
  createdAt: string;
  notified: boolean;
  notifiedAt: string | null;
  feature: string;
}

interface WaitlistData {
  success: boolean;
  waitlist: WaitlistItem[];
  total: number;
  notified: number;
  unnotified: number;
  error?: string;
  message?: string;
}

export default function WaitlistPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<WaitlistData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWaitlist = async () => {
    if (!password.trim()) {
      setError('Please enter admin password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/view-waitlist', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${password}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch waitlist');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Waitlist Subscribers
            </CardTitle>
            <CardDescription>
              View all users who signed up for the student connections feature waitlist.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    fetchWaitlist();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={fetchWaitlist}
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Load Waitlist
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Default password: courseconnect (or set ADMIN_PASSWORD in .env.local)
            </p>

            {error && (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {data && (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{data.total}</div>
                      <p className="text-xs text-muted-foreground">Total Signups</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {data.notified}
                      </div>
                      <p className="text-xs text-muted-foreground">Notified</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {data.unnotified}
                      </div>
                      <p className="text-xs text-muted-foreground">Pending Notification</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Waitlist Table */}
                {data.waitlist.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Signed Up
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Notified At
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                          {data.waitlist.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {item.email}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(item.createdAt)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {item.notified ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle className="w-3 h-3" />
                                    Notified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                    <XCircle className="w-3 h-3" />
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {item.notifiedAt ? formatDate(item.notifiedAt) : '—'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      {data.message || 'No waitlist signups found.'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





