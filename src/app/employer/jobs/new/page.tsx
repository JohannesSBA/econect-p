"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  Loader2,
  Building2,
  MapPin,
  Type,
  Tags,
  DollarSign,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

const LISTING_FEE_ETB = 15000;

export default function NewEmployerJobPage() {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [jobType, setJobType] = useState("FULL_TIME");
  const [salary, setSalary] = useState("");
  const [tagsText, setTagsText] = useState("");
  const tags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10),
    [tagsText],
  );
  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const router = useRouter();
  const listingFeeDisplay = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ETB",
        maximumFractionDigits: 0,
      }).format(LISTING_FEE_ETB),
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !title.trim() ||
      !company.trim() ||
      !location.trim() ||
      !description.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (title.trim().length < 3) {
      toast.error("Title should be at least 3 characters.");
      return;
    }
    if (description.trim().length < 30) {
      toast.error("Description should be at least 30 characters.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        description: description.trim(),
        tags,
        salary: salary.trim() || undefined,
        jobType,
      };

      const res = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const job = await res.json();
      if (!res.ok) throw new Error(job?.error || "Failed to create job");

      const pay = await fetch("/api/payments/chapa/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          discountCode: discountCode.trim() || undefined,
        }),
      });
      const data = await pay.json();
      if (!pay.ok) throw new Error(data?.error || "Checkout failed");
      if (data.discountApplied && data.published) {
        toast.success("Discount applied. Job published!");
        router.push("../dashboard");
        return;
      }
      // Store payment id for confirmation and redirect to external link
      if (data.paymentId) localStorage.setItem("lastPaymentId", data.paymentId);
      window.location.href = data.checkout.hosted_url;
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="../dashboard"
            className="text-sm text-gray-600 hover:text-gray-800 inline-flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to dashboard
          </Link>
          <div className="text-xs text-gray-500">Step 1 of 2 • Create job</div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Create a New Job Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <div className="relative">
                    <Type className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="title"
                      placeholder="Senior Frontend Engineer"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="company"
                      placeholder="Acme Inc."
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      placeholder="Addis Ababa, ET (Hybrid)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobType">Job Type</Label>
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger id="jobType">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full-time</SelectItem>
                      <SelectItem value="PART_TIME">Part-time</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="INTERN">Intern</SelectItem>
                      <SelectItem value="FREELANCE">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="salary">Salary (optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="salary"
                      placeholder="e.g. 50,000 ETB/month or range"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated, up to 10)</Label>
                <div className="relative">
                  <Tags className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="tags"
                    placeholder="react, typescript, nextjs"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount code (optional)</Label>
                <Input
                  id="discount"
                  placeholder="Enter code e.g. FREE100"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Use <span className="font-medium">FREE100</span> to publish
                  for free during testing.
                </p>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-semibold">Job listing fee</p>
                <p className="mt-1 text-blue-800">
                  Each posting costs{" "}
                  <span className="font-semibold">{listingFeeDisplay}</span>.
                  You&apos;ll be redirected to Chapa to complete this payment
                  after submitting the form.
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  Discount codes are applied automatically during checkout.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={8}
                  placeholder="Describe responsibilities, requirements, benefits, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="text-xs text-gray-500 text-right">
                  {description.length} characters
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href="../dashboard"
                  className="text-sm text-gray-600 hover:underline"
                >
                  Cancel
                </Link>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                      Processing...
                    </>
                  ) : (
                    "Continue to Payment"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
