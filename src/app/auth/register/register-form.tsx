"use client";

import { useState } from "react";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Briefcase,
  Chrome,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Globe,
  Zap,
} from "lucide-react";

const registerCopy = {
  welcomeTitle: "Join Econnect",
  welcomeSubtitle: "Create your account and start your career journey in Ethiopia",
  title: "Create an account",
  description: "Create an account to get started",
  button: "Create an account",
  fillDetails: "Fill in your details to create an account",
  orRegisterWith: "Or register with",
  continueWithGoogle: "Continue with Google",
  signIn: "Sign in",
  existingAccountPrompt: "Already have an account?",
  experienceLevel: "Experience Level",
  signInLink: "Sign in",
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  phone: "Phone",
  password: "Password",
  confirmPassword: "Confirm Password",
  createAccount: "Create an account",
  emailPlaceholder: "Email address",
  alreadyHaveAccount: "Already have an account?",
  emailTab: "Email",
  phoneTab: "Phone",
  emailLabel: "Email",
  phoneLabel: "Phone",
  phonePlaceholder: "Phone number",
  submit: "Submit",
  secureRegistration: "Secure Registration",
  madeForEthiopia: "Made for Ethiopia",
  quickSetup: "Quick Setup",
  termsOfService: "Terms of Service",
  privacyPolicy: "Privacy Policy",
  newsletter: "Send me job alerts and career tips via email",
  agree: "I agree to the",
  and: "and",
  termsAgreement: "Terms of Service",
  location: "Location",
  experience: "Experience",
  entryLevel: "Entry Level (0-2 years)",
  midLevel: "Mid Level (2-5 years)",
  seniorLevel: "Senior Level (5-10 years)",
  expertLevel: "Expert Level (10+ years)",
  primaryContact: "Primary Contact",
  terms: "Terms",
  addisAbaba: "Addis Ababa",
  direDawa: "Dire Dawa",
  mekelle: "Mekelle",
  gondar: "Gondar",
  hawassa: "Hawassa",
  bahirDar: "Bahir Dar",
  adama: "Adama",
  jimma: "Jimma",
  selectLocation: "Select your city",
  selectExperience: "Select your experience level",
  accountType: "Account Type",
  employer: "Employer",
  jobSeeker: "Job Seeker",
  companyName: "Company Name",
  website: "Website",
};

const RegisterIllustration = () => (
  <svg
    viewBox="0 0 600 460"
    aria-hidden="true"
    focusable="false"
    className="h-auto w-full max-w-[480px] drop-shadow-xl"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        id="reg-gradient"
        x1="60"
        x2="480"
        y1="80"
        y2="380"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#1D4ED8" />
        <stop offset="0.5" stopColor="#4338CA" />
        <stop offset="1" stopColor="#7C3AED" />
      </linearGradient>
      <linearGradient
        id="reg-soft"
        x1="0"
        x2="320"
        y1="0"
        y2="320"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#EEF2FF" />
        <stop offset="1" stopColor="#DBEAFE" />
      </linearGradient>
      <linearGradient
        id="reg-accent"
        x1="0"
        x2="200"
        y1="0"
        y2="200"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#22D3EE" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <rect
      x="44"
      y="40"
      width="512"
      height="380"
      rx="48"
      fill="url(#reg-gradient)"
      opacity="0.12"
    />
    <rect
      x="76"
      y="98"
      width="468"
      height="292"
      rx="32"
      fill="#ffffff"
      opacity="0.92"
    />
    <rect
      x="108"
      y="148"
      width="214"
      height="176"
      rx="22"
      fill="url(#reg-soft)"
    />
    <rect x="352" y="148" width="156" height="120" rx="20" fill="#E0E7FF" />
    <rect
      x="352"
      y="282"
      width="156"
      height="68"
      rx="20"
      fill="#312E81"
      opacity="0.08"
    />
    <circle cx="214" cy="192" r="46" fill="#4338CA" opacity="0.2" />
    <circle cx="214" cy="190" r="42" fill="url(#reg-accent)" />
    <path
      d="M214 224c-27 0-48.8 19.4-52.8 45.1a6 6 0 0 0 6 6.9h93.6a6 6 0 0 0 6-6.9C262.8 243.4 241 224 214 224z"
      fill="#38BDF8"
      opacity="0.7"
    />
    <rect
      x="374"
      y="172"
      width="112"
      height="18"
      rx="9"
      fill="#312E81"
      opacity="0.15"
    />
    <rect
      x="374"
      y="202"
      width="84"
      height="16"
      rx="8"
      fill="#4338CA"
      opacity="0.2"
    />
    <circle cx="374" cy="318" r="14" fill="#22D3EE" opacity="0.8" />
    <rect
      x="402"
      y="310"
      width="84"
      height="16"
      rx="8"
      fill="#0EA5E9"
      opacity="0.28"
    />
    <path
      d="M474 268c-14.3 0-25.8-11.5-25.8-25.8S459.7 216.4 474 216.4s25.8 11.5 25.8 25.8S488.3 268 474 268zm12.7-26.3h-10v-10a3 3 0 0 0-3-3h-0.1a3 3 0 0 0-3 3v10h-10a3 3 0 0 0-3 3v0.1a3 3 0 0 0 3 3h10v10a3 3 0 0 0 3 3H474a3 3 0 0 0 3-3v-10h10a3 3 0 0 0 3-3v-0.1a3 3 0 0 0-3-3z"
      fill="#38BDF8"
      opacity="0.85"
    />
    <rect
      x="140"
      y="320"
      width="188"
      height="20"
      rx="10"
      fill="#F8FAFC"
      opacity="0.65"
    />
    <circle cx="134" cy="126" r="12" fill="#C7D2FE" opacity="0.8" />
    <circle cx="494" cy="126" r="18" fill="#F472B6" opacity="0.35" />
    <circle cx="126" cy="326" r="24" fill="#A855F7" opacity="0.2" />
  </svg>
);

export default function RegisterForm() {
  const [stage, setStage] = useState<"form" | "verify">("form");
  const [formStep, setFormStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    experience: "",
    password: "",
    confirmPassword: "",
    terms: false,
    newsletter: false,
    accountType: "JOB_SEEKER" as "JOB_SEEKER" | "EMPLOYER",
    companyName: "",
    website: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (
    name: "terms" | "newsletter",
    checked: boolean | "indeterminate",
  ) => {
    setFormData((prev) => ({ ...prev, [name]: Boolean(checked) }));
  };

  const handleAccountTypeChange = (type: "JOB_SEEKER" | "EMPLOYER") => {
    setFormData((prev) => ({ ...prev, accountType: type }));
  };

  const isEmployer = formData.accountType === "EMPLOYER";
  const totalSteps = 3;
  const isLastFormStep = formStep === totalSteps - 1;
  const passwordsMatch = formData.password === formData.confirmPassword;

  const canAdvance = (() => {
    if (formStep === 0) {
      return Boolean(formData.firstName.trim() && formData.lastName.trim());
    }
    if (formStep === 1) {
      const baseReady = Boolean(
        formData.email.trim() &&
          formData.phone.trim() &&
          formData.location &&
          formData.experience,
      );
      if (!baseReady) return false;
      if (isEmployer) {
        return Boolean(formData.companyName.trim() && formData.website.trim());
      }
      return true;
    }
    if (formStep === 2) {
      return Boolean(
        formData.password &&
          formData.confirmPassword &&
          passwordsMatch &&
          formData.terms,
      );
    }
    return false;
  })();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLastFormStep) {
      if (!canAdvance) {
        toast.error("Please complete all required fields.");
        return;
      }
      setFormStep((prev) => Math.min(prev + 1, totalSteps - 1));
      return;
    }

    if (!formData.terms) {
      toast.error("Please agree to the terms to continue.");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/auth/register", formData);

      if (response.status === 409) {
        toast.error("Email or phone already in use");
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
        return;
      }

      setStage("verify");
      toast.success("We just sent you a verification code!");
    } catch (error) {
      if (error instanceof AxiosError && error.status === 409) {
        toast.error("Email or phone already in use");
        return;
      }

      console.error("Registration error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post("/api/auth/verify", {
        formData,
        code: otp,
        ...formData,
      });
      toast.success("Account verified successfully!");
      router.push("/auth/login");
    } catch (err) {
      console.error(err);
      toast.error("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepIndicators = (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, idx) => (
        <span
          key={idx}
          className={`h-2 w-2 rounded-full transition ${
            idx === formStep ? "bg-blue-600" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );

  const accountStep = (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          {registerCopy.accountType}
        </Label>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => handleAccountTypeChange("JOB_SEEKER")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
              isEmployer
                ? "text-slate-500 hover:text-slate-700"
                : "bg-white text-slate-900 shadow"
            }`}
          >
            <User className="h-4 w-4" />
            {registerCopy.jobSeeker}
          </button>
          <button
            type="button"
            onClick={() => handleAccountTypeChange("EMPLOYER")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
              isEmployer
                ? "bg-white text-slate-900 shadow"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            {registerCopy.employer}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="firstName"
            className="text-sm font-medium text-slate-700"
          >
            {registerCopy.firstName}
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              id="firstName"
              name="firstName"
              type="text"
              onChange={handleChange}
              value={formData.firstName}
              placeholder={registerCopy.firstName}
              className="h-12 rounded-xl border-slate-200 pl-10 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
              autoComplete="given-name"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="lastName"
            className="text-sm font-medium text-slate-700"
          >
            {registerCopy.lastName}
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              id="lastName"
              name="lastName"
              type="text"
              onChange={handleChange}
              value={formData.lastName}
              placeholder={registerCopy.lastName}
              className="h-12 rounded-xl border-slate-200 pl-10 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
              autoComplete="family-name"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const contactStep = (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            {registerCopy.email}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              id="email"
              name="email"
              type="email"
              onChange={handleChange}
              value={formData.email}
              placeholder={registerCopy.email}
              className="h-12 rounded-xl border-slate-200 pl-10 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
              autoComplete="email"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
            {registerCopy.phone}
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              onChange={handleChange}
              value={formData.phone}
              placeholder={`${registerCopy.phone} (09XXXXXXXX)`}
              className="h-12 rounded-xl border-slate-200 pl-10 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
              autoComplete="tel"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="location"
            className="text-sm font-medium text-slate-700"
          >
            {registerCopy.location}
          </Label>
          <Select
            value={formData.location}
            onValueChange={(value) => handleSelectChange("location", value)}
          >
            <SelectTrigger className="h-12 rounded-xl border-slate-200 px-4 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-400" />
                <SelectValue placeholder={registerCopy.location} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="addis-ababa">{registerCopy.addisAbaba}</SelectItem>
              <SelectItem value="dire-dawa">{registerCopy.direDawa}</SelectItem>
              <SelectItem value="mekelle">{registerCopy.mekelle}</SelectItem>
              <SelectItem value="gondar">{registerCopy.gondar}</SelectItem>
              <SelectItem value="hawassa">{registerCopy.hawassa}</SelectItem>
              <SelectItem value="bahir-dar">{registerCopy.bahirDar}</SelectItem>
              <SelectItem value="adama">{registerCopy.adama}</SelectItem>
              <SelectItem value="jimma">{registerCopy.jimma}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="experience"
            className="text-sm font-medium text-slate-700"
          >
            {registerCopy.experienceLevel}
          </Label>
          <Select
            value={formData.experience}
            onValueChange={(value) => handleSelectChange("experience", value)}
          >
            <SelectTrigger className="h-12 rounded-xl border-slate-200 px-4 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-slate-400" />
                <SelectValue placeholder={registerCopy.experienceLevel} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">{registerCopy.entryLevel}</SelectItem>
              <SelectItem value="mid">{registerCopy.midLevel}</SelectItem>
              <SelectItem value="senior">{registerCopy.seniorLevel}</SelectItem>
              <SelectItem value="expert">{registerCopy.expertLevel}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isEmployer && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="companyName"
              className="text-sm font-medium text-slate-700"
            >
              {registerCopy.companyName}
            </Label>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              onChange={handleChange}
              value={formData.companyName}
              placeholder={registerCopy.companyName}
              className="h-12 rounded-xl border-slate-200 px-4 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              autoComplete="organization"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="website"
              className="text-sm font-medium text-slate-700"
            >
              {registerCopy.website}
            </Label>
            <Input
              id="website"
              name="website"
              type="url"
              onChange={handleChange}
              value={formData.website}
              placeholder="https://example.com"
              className="h-12 rounded-xl border-slate-200 px-4 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              autoComplete="url"
            />
          </div>
        </div>
      )}
    </div>
  );

  const securityStep = (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            {registerCopy.password}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              onChange={handleChange}
              value={formData.password}
              placeholder={registerCopy.password}
              className="h-12 rounded-xl border-slate-200 pl-10 pr-12 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-2.5 rounded-lg p-1 text-slate-400 transition hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-slate-700"
          >
            {registerCopy.confirmPassword}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              onChange={handleChange}
              value={formData.confirmPassword}
              placeholder={registerCopy.confirmPassword}
              className="h-12 rounded-xl border-slate-200 pl-10 pr-12 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-2.5 rounded-lg p-1 text-slate-400 transition hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {!passwordsMatch && formData.confirmPassword && (
        <p className="text-sm text-red-500">Passwords do not match.</p>
      )}

      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
          <Checkbox
            id="terms"
            checked={formData.terms}
            onCheckedChange={(checked) =>
              handleCheckboxChange("terms", checked)
            }
            className="mt-1"
          />
          <Label htmlFor="terms" className="text-sm text-slate-600">
            {registerCopy.termsOfService} {registerCopy.and}{" "}
            <Link
              href="/privacy"
              className="font-medium text-blue-600 transition hover:text-blue-700"
            >
              {registerCopy.privacyPolicy}
            </Link>
          </Label>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
          <Checkbox
            id="newsletter"
            checked={formData.newsletter}
            onCheckedChange={(checked) =>
              handleCheckboxChange("newsletter", checked)
            }
            className="mt-1"
          />
          <Label htmlFor="newsletter" className="text-sm text-slate-600">
            {registerCopy.newsletter}
          </Label>
        </div>
      </div>
    </div>
  );

  const formSections = [accountStep, contactStep, securityStep];

  return (
    <div className="flex h-full w-full flex-col-reverse justify-center gap-10 md:flex-row md:items-center md:justify-between">
      <div className="w-full max-w-xl">
        <Card className="flex h-full flex-col border-0 bg-white/90 shadow-xl backdrop-blur">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-2xl font-semibold text-slate-900">
              {stage === "form" ? registerCopy.createAccount : "Verify your account"}
            </CardTitle>
            <p className="text-sm text-slate-600">
              {stage === "form"
                ? registerCopy.fillDetails
                : "Enter the verification code we sent to your email and phone."}
            </p>
            {stage === "form" && stepIndicators}
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6">
            {stage === "form" ? (
              <>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:bg-slate-900 hover:text-white hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                    type="button"
                  >
                    <Chrome className="h-5 w-5" />
                    {registerCopy.continueWithGoogle}
                  </Button>
                </div>

                <div className="relative">
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden
                  >
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-500">
                      {registerCopy.orRegisterWith}
                    </span>
                  </div>
                </div>

                <form
                  onSubmit={handleFormSubmit}
                  className="flex flex-1 flex-col gap-6"
                >
                  <div className="flex-1 space-y-5 overflow-hidden">
                    {formSections[formStep]}
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2">
                    {formStep > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setFormStep((prev) => Math.max(prev - 1, 0))
                        }
                        className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                      >
                        Back
                      </Button>
                    ) : (
                      <span className="flex-1" />
                    )}

                    <Button
                      type="submit"
                      disabled={loading || !canAdvance}
                      className={`flex-1 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-80 ${
                        loading || !canAdvance ? "opacity-50" : ""
                      }`}
                    >
                      {isLastFormStep ? (
                        loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          registerCopy.submit
                        )
                      ) : (
                        "Continue"
                      )}
                    </Button>
                  </div>
                </form>

                <div className="text-center text-sm text-slate-600">
                  {registerCopy.alreadyHaveAccount}{" "}
                  <Link
                    href="/auth/login"
                    className="font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    {registerCopy.signIn}
                  </Link>
                </div>
              </>
            ) : (
              <form
                onSubmit={handleVerifyOtp}
                className="flex flex-1 flex-col justify-between gap-6"
              >
                <div className="space-y-2 text-left">
                  <Label
                    htmlFor="otp"
                    className="text-sm font-medium text-slate-700"
                  >
                    Enter the 6-digit code
                  </Label>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    maxLength={6}
                    placeholder="123456"
                    className="h-14 rounded-xl border-slate-200 text-center text-lg tracking-[0.6em] shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    autoFocus
                    required
                  />
                  <p className="text-xs text-slate-500">
                    {registerCopy.email} {registerCopy.and} {registerCopy.phone}
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-80"
                    type="submit"
                    disabled={loading || otp.length < 6}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                  <Button
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 text-base font-semibold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                    type="button"
                    onClick={() => {
                      setStage("form");
                      setFormStep(0);
                    }}
                    disabled={loading}
                  >
                    Back to form
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {registerCopy.secureRegistration}
          </span>
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {registerCopy.madeForEthiopia}
          </span>
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {registerCopy.quickSetup}
          </span>
        </div>
      </div>

      <div className="hidden h-full max-w-md flex-1 flex-col items-center justify-center text-center md:flex lg:items-start lg:text-left">
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            {registerCopy.secureRegistration}
          </h2>
          <p className="text-base text-slate-600 sm:text-lg">
            {registerCopy.quickSetup}
          </p>
        </div>
        <div className="mt-8 w-full">
          <RegisterIllustration />
        </div>
        {stage === "form" && (
          <ul className="mt-6 w-full space-y-3 text-left text-sm text-slate-600">
            <li className="rounded-2xl border border-blue-100 bg-white/70 p-4 shadow-sm backdrop-blur">
              {registerCopy.fillDetails}
            </li>
            <li className="rounded-2xl border border-purple-100 bg-white/70 p-4 shadow-sm backdrop-blur">
              {registerCopy.newsletter}
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
