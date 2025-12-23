"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { formatCurrency } from "../utils";

type PaymentEntry = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  product: string;
  createdAt: string;
  employer: {
    id: string;
    name: string | null;
    email: string;
  };
  job?: {
    id: string;
    title: string | null;
  } | null;
};

interface PaymentsPanelProps {
  initialPayments: PaymentEntry[];
}

export function PaymentsPanel({ initialPayments }: PaymentsPanelProps) {
  const [status, setStatus] = useState<string>("all");
  const [payments, setPayments] = useState(initialPayments);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const query =
          status === "all" ? "" : `?status=${encodeURIComponent(status)}`;
        const res = await fetch(`/api/admin/payments${query}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch payments");
        const data = (await res.json()) as { payments: PaymentEntry[] };
        setPayments(
          data.payments.map((payment) => ({
            ...payment,
            createdAt: new Date(payment.createdAt).toISOString(),
          })),
        );
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error(error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
    return () => controller.abort();
  }, [status]);

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Payments
          </CardTitle>
          <p className="text-sm text-slate-500">
            Monitor Chapa transactions and premium upgrades.
          </p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PAID">Completed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>

        <div className="space-y-3">
          {payments.length === 0 && (
            <p className="text-xs text-slate-500">No transactions found.</p>
          )}
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-wrap items-center justify-between rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm shadow-sm"
            >
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">
                  {payment.employer.name ?? "Employer"}
                </p>
                <p className="text-xs text-slate-500">
                  {payment.employer.email}
                </p>
                <p className="text-[0.65rem] text-slate-400">
                  {new Date(payment.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-emerald-600">
                  {formatCurrency(payment.amount)}
                </p>
                <p className="text-xs text-slate-500">{payment.product}</p>
                <Badge className="mt-1 bg-slate-100 text-slate-600">
                  {payment.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
