"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const GoogleAdsSummaryPage = () => {
  const params = useSearchParams();
  const name = params.get('name') || '';
  const id = params.get('id') || '';

  const [status, setStatus] = useState<'refreshing' | 'completed'>('refreshing');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const triesRef = useRef(0);

  useEffect(() => {
    const poll = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('User_token') : null;
        if (!token) return;
        
        const [cRes, aRes, iRes] = await Promise.all([
          fetch('http://localhost:5000/api/google-ads/campaigns', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/google-ads/ads', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/google-ads/insights?startDate=2024-01-01&endDate=2024-12-31', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        
        const [c, a, i] = await Promise.all([
          cRes.ok ? cRes.json() : { campaigns: [] },
          aRes.ok ? aRes.json() : { ads: [] },
          iRes.ok ? iRes.json() : { insights: [] },
        ]);
        
        const hasData = (c.campaigns?.length || 0) > 0 || (a.ads?.length || 0) > 0 || (i.insights?.length || 0) > 0;
        if (hasData) {
          setStatus('completed');
          if (timerRef.current) clearTimeout(timerRef.current);
          return;
        }
      } catch (e) {
        // ignore transient errors during polling
      }
      triesRef.current += 1;
      if (triesRef.current < 40) {
        timerRef.current = setTimeout(poll, 3000);
      }
    };

    poll();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center font-custom p-4">
      <div className="max-w-md mx-auto">
        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-blue-600 font-bold text-2xl">G</span>
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Google Ads Connected
        </h1>
        
        <p className="text-gray-600 mb-6">
          Account: <span className="font-medium">{name}</span>
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={`h-2 w-2 rounded-full ${status === 'completed' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
            <span className="text-sm font-medium">
              {status === 'completed' ? 'Data Synced' : 'Syncing Data...'}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {status === 'completed' 
              ? 'Your Google Ads data has been successfully synced' 
              : 'Fetching campaigns, ads, and insights from your Google Ads account'
            }
          </p>
        </div>
        
        <button 
          onClick={() => window.location.href = '/welcome/integrations'}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default GoogleAdsSummaryPage;
