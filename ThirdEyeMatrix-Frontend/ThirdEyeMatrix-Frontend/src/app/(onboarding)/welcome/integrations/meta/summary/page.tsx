"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const MetaSummaryPage = () => {
  const params = useSearchParams();
  const name = params.get('name') || '';
  const id = params.get('id') || '';
  const aw = params.get('aw') || '';

  const [status, setStatus] = useState<'refreshing' | 'completed'>('refreshing');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const triesRef = useRef(0);

  useEffect(() => {
    const poll = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('User_token') : null;
        if (!token) return;
        const [cRes, aRes, iRes] = await Promise.all([
          fetch('http://localhost:5000/api/meta/campaigns', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/meta/ads', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/meta/insights?level=campaign&time_increment=1', { headers: { Authorization: `Bearer ${token}` } }),
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
      // stop after ~2 minutes (40 tries x 3s)
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
    <div className="relative flex items-center justify-center min-h-[80vh] ">
      <div className="w-full grid grid-cols-1">
        <div className="flex items-center justify-center px-1 py-1 md:p-12">
          <div className="w-full sm:max-w-md md:max-w-md lg:max-w-md bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl mb-3 font-bold text-black font-custom">Connection Details</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-500 font-custom">
                Your Meta Ads connection is being prepared.
              </p>
            </div>
            <div className="space-y-3 pt-4 font-custom">
              <div className="flex items-start justify-between gap-4">
                <span className="text-md font-semibold text-gray-700">Meta Attribution Window :</span>
                <span className="text-md text-gray-800">{aw.replaceAll('_', '-')}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-md font-semibold text-gray-700">ID :</span>
                <span className="text-md text-gray-800 break-all">{id}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-md font-semibold text-gray-700">Name :</span>
                <span className="text-md text-gray-800">{name}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-md font-semibold text-gray-700">Status :</span>
                <span className="text-md text-gray-800">{status === 'refreshing' ? 'Refreshing Data...' : 'Fetch completed'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaSummaryPage;


