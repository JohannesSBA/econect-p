"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ChapaReturnPage({ params }: { params: Promise<{ lang: 'en' | 'am' | 'om' }> }) {
  const search = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'pending'|'success'|'failed'>('pending');

  useEffect(() => {
    // In a real flow, we'd verify on server or wait for webhook to reflect PAID
    const s = search.get('status');
    if (s === 'success') setStatus('success');
    else if (s === 'failed') setStatus('failed');
    else setStatus('pending');
  }, [search]);

  return (
    <div className="max-w-xl mx-auto p-8 text-center">
      <h1 className="text-2xl font-semibold mb-2">Payment</h1>
      {status === 'pending' && <p>Awaiting confirmation...</p>}
      {status === 'success' && <p>Payment successful. You can close this tab.</p>}
      {status === 'failed' && <p>Payment failed. Please try again.</p>}
      <button className="mt-6 px-4 py-2 rounded bg-blue-600 text-white" onClick={()=>router.push('/')}>Go Home</button>
    </div>
  );
}

