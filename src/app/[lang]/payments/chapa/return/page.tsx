"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ChapaReturnPage({ params: _params }: { params: Promise<{ lang: 'en' | 'am' | 'om' }> }) {
  const search = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'pending'|'success'|'failed'>('pending');
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string>("")
  const [job, setJob] = useState<any | null>(null)

  useEffect(() => {
    const s = search.get('status');
    if (s === 'success') setStatus('success');
    else if (s === 'failed') setStatus('failed');
    else setStatus('pending');

    // If we have stored payment id from checkout, attempt auto-confirm on success
    const pid = localStorage.getItem('lastPaymentId');
    if (pid && (s === 'success' || s === 'paid')) {
      setPaymentId(pid)
      confirmPayment(pid)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmPayment(paymentId?: string) {
    const pid = paymentId || localStorage.getItem('lastPaymentId') || ''
    if (!pid) {
      setMessage('No payment found to confirm.')
      return
    }
    setConfirming(true)
    try {
      // Try dev confirm route first. If disabled (403), fall back to polling /status
      const res = await fetch('/api/payments/chapa/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: pid }) })
      if (res.status === 403) {
        // Poll status for a short time if webhook updates the record
        await pollUntilPaid(pid)
        return
      }
      if (!res.ok) throw new Error('Failed to confirm payment')
      const data = await res.json()
      setStatus('success')
      setMessage('Payment confirmed. Your job is now published.')
      if (data?.jobId) await loadJob(data.jobId)
      setTimeout(() => router.push('/en/employer/jobs/active'), 1500)
    } catch (error: unknown) {
      const fallbackMessage = error instanceof Error ? error.message : null
      setMessage(fallbackMessage || "Confirmation failed.")
    } finally {
      setConfirming(false)
    }
  }

  async function pollUntilPaid(pid: string) {
    setMessage('Checking payment status...')
    const start = Date.now()
    const timeoutMs = 60_000
    while (Date.now() - start < timeoutMs) {
      const res = await fetch(`/api/payments/status?paymentId=${encodeURIComponent(pid)}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (String(data.status).toUpperCase() === 'PAID') {
          setStatus('success')
          setMessage('Payment verified. Your job is now published.')
          if (data?.jobId) await loadJob(data.jobId)
          setTimeout(() => router.push('/en/employer/jobs/active'), 1500)
          return
        }
      }
      await new Promise(r => setTimeout(r, 3000))
    }
    setMessage('Still pending. You may refresh this page later.')
  }

  async function loadJob(jobId: string) {
    try {
      const res = await fetch(`/api/jobs/application?id=${encodeURIComponent(jobId)}`, { cache: 'no-store' })
      if (!res.ok) return
      const listing = await res.json()
      setJob(listing)
    } catch {}
  }

  return (
    <div className="max-w-xl mx-auto p-8 text-center">
      <h1 className="text-2xl font-semibold mb-3">Payment</h1>
      {status === 'pending' && <p className="text-gray-600">Awaiting confirmation...</p>}
      {status === 'success' && <p className="text-green-700">Payment successful. Finalizing...</p>}
      {status === 'failed' && <p className="text-red-600">Payment failed. Please try again.</p>}
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="outline" onClick={()=>router.push('/')}>
          Go Home
        </Button>
        <Button onClick={()=>confirmPayment()} disabled={confirming}>
          {confirming ? 'Confirming...' : 'I completed payment'}
        </Button>
      </div>

      {/* Manual paymentId entry if needed */}
      <div className="mt-6 max-w-md mx-auto">
        <p className="text-sm text-gray-600 mb-2">If needed, paste your payment ID here:</p>
        <div className="flex gap-2">
          <input value={paymentId} onChange={e=>setPaymentId(e.target.value)} placeholder="paymentId" className="flex-1 border rounded px-3 py-2" />
          <Button variant="secondary" onClick={()=>confirmPayment(paymentId)} disabled={!paymentId}>Confirm</Button>
        </div>
      </div>

      {/* Success summary */}
      {status === 'success' && job && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4 text-left max-w-xl mx-auto">
          <h2 className="font-semibold text-green-800">Job published</h2>
          <p className="text-sm text-green-700 mt-1">{job?.title} — {job?.company} • {job?.location}</p>
          <p className="text-xs text-green-700 mt-1">You’ll be redirected to your active listings shortly.</p>
        </div>
      )}
    </div>
  );
}
