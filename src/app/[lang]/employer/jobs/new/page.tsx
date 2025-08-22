"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewEmployerJobPage({ params }: { params: Promise<{ lang: 'en' | 'am' | 'om' }> }) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, company, location, description }),
      });
      const job = await res.json();
      if (!res.ok) throw new Error(job?.error || "Failed");
      const pay = await fetch("/api/payments/chapa/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await pay.json();
      if (!pay.ok) throw new Error(data?.error || "Checkout failed");
      window.location.href = data.checkout.hosted_url;
    } catch (e) {
      console.error(e);
      alert("Error: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Job</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full border p-2 rounded" placeholder="Job title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Company" value={company} onChange={e=>setCompany(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Location" value={location} onChange={e=>setLocation(e.target.value)} />
        <textarea className="w-full border p-2 rounded" rows={8} placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
        <button disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white">{loading ? 'Processing...' : 'Continue to Payment'}</button>
      </form>
    </div>
  );
}

