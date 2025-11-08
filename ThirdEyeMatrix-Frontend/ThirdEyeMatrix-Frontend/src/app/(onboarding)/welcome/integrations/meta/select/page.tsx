"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Business = { id: string; name: string };
type AdAccount = { id: string; account_id?: string; name: string };

const MetaSelectPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>("");
  const [attributionWindow, setAttributionWindow] = useState<string>("7d_click_1d_view");
  const token = typeof window !== 'undefined' ? localStorage.getItem('User_token') : null;

  useEffect(() => {
    const run = async () => {
      if (!token) {
        router.push('/auth/user/signin');
        return;
      }
      try {
        const res = await fetch('http://localhost:5000/api/meta/businesses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch businesses');
        setBusinesses(data.businesses || []);
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedBusiness || !token) return;
      try {
        const url = new URL('http://localhost:5000/api/meta/ad-accounts');
        url.searchParams.set('businessId', selectedBusiness);
        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch ad accounts');
        setAdAccounts(data.adAccounts || []);
      } catch (e) {
        alert((e as Error).message);
      }
    };
    run();
  }, [selectedBusiness]);

  const handleSave = async () => {
    if (!token) return router.push('/auth/user/signin');
    if (!selectedBusiness || !selectedAdAccount) {
      alert('Please select business and ad account');
      return;
    }
    const businessName = businesses.find(b=>b.id===selectedBusiness)?.name || '';
    const ad = adAccounts.find(a=>a.id===selectedAdAccount);
    try {
      const res = await fetch('http://localhost:5000/api/meta/save-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId: selectedBusiness,
          businessName,
          adAccountId: selectedAdAccount,
          adAccountName: ad?.name || '',
          attributionWindow,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save selection');
      router.push(`/welcome/integrations/meta/summary?name=${encodeURIComponent(data.connection.name)}&id=${encodeURIComponent(data.connection.id)}&aw=${encodeURIComponent(data.connection.metaAttributionWindow)}`);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="relative flex items-center justify-center min-h-[80vh] ">
      <div className="w-full grid grid-cols-1">
        <div className="flex items-center justify-center px-1 py-1 md:p-12">
          <div className="w-full sm:max-w-md md:max-w-lg lg:max-w-lg bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8">
            <div className="mb-6 text-center">
              <h1 className="text-3xl sm:text-3xl mb-3 font-bold text-black font-custom">Connect Meta Ads</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400 font-custom">
                Choose your attribution window and connect your Business and Ad Account
              </p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block mb-1 text-md font-semibold font-custom">Attribution Window</label>
                <select
                  value={attributionWindow}
                  onChange={(e)=>setAttributionWindow(e.target.value)}
                  className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                >
                  <option value="7d_click_1d_view">7-Day Click, 1-Day View</option>
                  <option value="7d_click">7-Day Click</option>
                  <option value="1d_click_1d_view">1-Day Click, 1-Day View</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-md font-semibold font-custom">Business</label>
                <select
                  value={selectedBusiness}
                  onChange={(e)=>setSelectedBusiness(e.target.value)}
                  className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                >
                  <option value="">Select a business</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-md font-semibold font-custom">Ad Account</label>
                <select
                  value={selectedAdAccount}
                  onChange={(e)=>setSelectedAdAccount(e.target.value)}
                  className="w-full px-4 py-2 border font-custom border-gray-300 rounded-lg focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none disabled:opacity-50"
                  disabled={!adAccounts.length}
                >
                  <option value="">Select an ad account</option>
                  {adAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSave}
                className="w-full py-2 mt-1 cursor-pointer font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaSelectPage;


