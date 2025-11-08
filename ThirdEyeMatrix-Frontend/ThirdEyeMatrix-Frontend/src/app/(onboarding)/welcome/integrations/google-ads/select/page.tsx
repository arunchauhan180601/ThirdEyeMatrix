"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CustomerAccount = { id: string; name: string; resourceName: string };

const GoogleAdsSelectPage = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerAccounts();
  }, []);

  const fetchCustomerAccounts = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('User_token') : null;
      if (!token) {
        router.push('/auth/user/signin');
        return;
      }

      const res = await fetch('http://localhost:5000/api/google-ads/customer-accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch customer accounts');
      }

      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = async (customer: CustomerAccount) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('User_token') : null;
      if (!token) return;

      const res = await fetch('http://localhost:5000/api/google-ads/save-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: customer.id,
          customerName: customer.name,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save selection');
      }

      const data = await res.json();
      router.push(`/welcome/integrations/google-ads/summary?name=${encodeURIComponent(customer.name)}&id=${customer.id}`);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center font-custom p-4">
      <h1 className="text-2xl sm:text-4xl font-semibold text-gray-800 mb-4">
        Select Google Ads Account
      </h1>
      <p className="text-sm sm:text-lg text-gray-600 mb-8 max-w-xl">
        Choose the Google Ads account you want to connect to Third Eye Matrix.
      </p>
      
      <div className="w-full max-w-2xl space-y-4">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="flex items-center justify-between p-4 border shadow-md rounded-lg bg-white hover:shadow-xl cursor-pointer"
            onClick={() => handleSelectCustomer(customer)}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">G</span>
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">{customer.name}</div>
                <div className="text-sm text-gray-500">ID: {customer.id}</div>
              </div>
            </div>
            <button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm">
              Select
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoogleAdsSelectPage;
