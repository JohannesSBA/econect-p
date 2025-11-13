"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ChapaReturnPage() {
  const search = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'pending'|'success'|'failed'>('pending');
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string>("")
  const [job, setJob] = useState<any | null>(null)
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null)

  useEffect(() => {
    const s = (search.get('status') || '').toLowerCase();
    if (s === 'success' || s === 'paid') setStatus('success');
    else if (s === 'failed' || s === 'canceled') setStatus('failed');
    else setStatus('pending');

    const pid = localStorage.getItem('lastPaymentId');
    if (pid) {
      setPaymentId(pid)
      if (s !== 'failed' && s !== 'canceled') {
        setAutoCountdown(10)
        setMessage('Payment completed on Chapa. We will verify it automatically in a few seconds.')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoCountdown === null) return;
    if (autoCountdown <= 0) {
      confirmPayment()
      setAutoCountdown(null)
      return
    }
    const timer = setTimeout(() => {
      setAutoCountdown(prev => (prev ?? 1) - 1)
    }, 1000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCountdown]);

  async function confirmPayment(paymentId?: string) {
    const pid = paymentId || localStorage.getItem('lastPaymentId') || ''
    if (!pid) {
      setMessage('No payment found to confirm.')
      return
    }
    setAutoCountdown(null)
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
      setTimeout(() => router.push('/employer/jobs/active'), 1500)
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
          setTimeout(() => router.push('/employer/jobs/active'), 1500)
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
      {autoCountdown !== null && autoCountdown > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span>Waiting for Chapa... auto verifying in {autoCountdown}s</span>
        </div>
      )}
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="outline" onClick={()=>router.push('/')}>
          Go Home
        </Button>
        <Button onClick={()=>confirmPayment()} disabled={confirming || (autoCountdown !== null && autoCountdown > 0)}>
          {confirming ? 'Confirming...' : (autoCountdown !== null && autoCountdown > 0) ? `Auto verifying in ${autoCountdown}s` : 'I completed payment'}
        </Button>
      </div>

      {/* Manual paymentId entry if needed */}
      <div className="mt-6 max-w-md mx-auto">
        <p className="text-sm text-gray-600 mb-2">If needed, paste your payment ID here:</p>
        <div className="flex gap-2">
          <input value={paymentId} onChange={e=>setPaymentId(e.target.value)} placeholder="paymentId" className="flex-1 border rounded px-3 py-2" />
          <Button variant="secondary" onClick={()=>confirmPayment(paymentId)} disabled={!paymentId || confirming}>Confirm</Button>
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
