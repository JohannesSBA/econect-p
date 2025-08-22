'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import axios from 'axios';
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
} from 'lucide-react';
import { Dictionary } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface RegisterFormProps {
  dict: Dictionary['register'];
  lang: 'en' | 'am' | 'om';
}


export default function RegisterForm({ dict, lang }: RegisterFormProps) {
    const [step, setStep] = useState<'register' | 'verify'>('register');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    experience: '',
    password: '',
    confirmPassword: '',
    terms: false,
    newsletter: false,
    accountType: 'JOB_SEEKER',
    companyName: '',
    website: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // const handleCheckboxChange = (name: string, checked: boolean) => {
  //   setFormData(prev => ({ ...prev, [name]: checked }));
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true);
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/register', formData);
      console.log('Success:', response.data);
      // Optionally redirect or show success message
    } catch (error) {
      toast.error(`${error}`);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
      setStep('verify');
    }
  };

    const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/verify', {
        formData,
        code: otp,
        // now include the rest of formData (password, name, etc)
        ...formData,
      });
      router.push(`/${lang}/auth/login`);
    } catch (err) {
      console.error(err);
      // show “wrong code” error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 py-8">
      <div className="w-full max-w-lg">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{dict.welcomeTitle}</h1>
          <p className="text-gray-600">{dict.welcomeSubtitle}</p>
        </div>

        {/* Registration Card */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">{dict.createAccount}</CardTitle>
            <p className="text-center text-gray-600">{dict.fillDetails}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Social Register Button */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full bg-white hover:bg-gray-50 border-gray-200 py-6" type="button">
                <Chrome className="mr-2 h-5 w-5" />
                {dict.continueWithGoogle}
              </Button>
            </div>

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">{dict.orRegisterWith}</span>
              </div>
            </div>

            {/* Form Fields */}
           {step === 'register' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Type */}
              <div className="space-y-2">
                <Label>{dict.accountType}</Label>
                <div className="flex gap-4">
                  <button type="button" onClick={()=>setFormData(p=>({...p, accountType:'JOB_SEEKER'}))} className={`px-3 py-2 rounded border ${formData.accountType==='JOB_SEEKER' ? 'bg-blue-50 border-blue-400' : 'border-gray-200'}`}>{dict.jobSeeker}</button>
                  <button type="button" onClick={()=>setFormData(p=>({...p, accountType:'EMPLOYER'}))} className={`px-3 py-2 rounded border ${formData.accountType==='EMPLOYER' ? 'bg-blue-50 border-blue-400' : 'border-gray-200'}`}>{dict.employer}</button>
                </div>
              </div>
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{dict.firstName}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      onChange={handleChange}
                      value={formData.firstName}
                      placeholder={dict.firstName}
                      className="pl-10 py-6 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{dict.lastName}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      onChange={handleChange}
                      value={formData.lastName}
                      placeholder={dict.lastName}
                      className="pl-10 py-6 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email & Phone Fields */}
              <div className="space-y-2">
                <Label htmlFor="email">{dict.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    onChange={handleChange}
                    value={formData.email}
                    placeholder={dict.email}
                    className="pl-10 py-6 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <Label htmlFor="phone">{dict.phone}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    onChange={handleChange}
                    value={formData.phone}
                    placeholder={dict.phone + " (09XXXXXXXX)"}
                    className="pl-10 py-6 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Employer fields */}
              {formData.accountType === 'EMPLOYER' && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">{dict.companyName}</Label>
                  <Input id="companyName" name="companyName" type="text" onChange={handleChange} value={formData.companyName} placeholder={dict.companyName} className="py-6 bg-white border-gray-200" />
                  <Label htmlFor="website">{dict.website}</Label>
                  <Input id="website" name="website" type="url" onChange={handleChange} value={formData.website} placeholder="https://example.com" className="py-6 bg-white border-gray-200" />
                </div>
              )}

              {/* Location Select */}
              <div className="space-y-2">
                <Label htmlFor="location">{dict.location}</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => handleSelectChange('location', value)}
                >
                  <SelectTrigger className="py-6 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 w-full">
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5 text-gray-400" />
                      <SelectValue placeholder={dict.location} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="addis-ababa">{dict.addisAbaba}</SelectItem>
                    <SelectItem value="dire-dawa">{dict.direDawa}</SelectItem>
                    <SelectItem value="mekelle">{dict.mekelle}</SelectItem>
                    <SelectItem value="gondar">{dict.gondar}</SelectItem>
                    <SelectItem value="hawassa">{dict.hawassa}</SelectItem>
                    <SelectItem value="bahir-dar">{dict.bahirDar}</SelectItem>
                    <SelectItem value="adama">{dict.adama}</SelectItem>
                    <SelectItem value="jimma">{dict.jimma}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Select */}
              <div className="space-y-2">
                <Label htmlFor="experience">{dict.experienceLevel}</Label>
                <Select
                  value={formData.experience}
                  onValueChange={(value) => handleSelectChange('experience', value)}
                >
                  <SelectTrigger className="py-6 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 w-full">
                    <div className="flex items-center">
                      <Briefcase className="mr-2 h-5 w-5 text-gray-400" />
                      <SelectValue placeholder={dict.experienceLevel} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">{dict.entryLevel}</SelectItem>
                    <SelectItem value="mid">{dict.midLevel}</SelectItem>
                    <SelectItem value="senior">{dict.seniorLevel}</SelectItem>
                    <SelectItem value="expert">{dict.expertLevel}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password Fields */}
              <div className="space-y-2">
                <Label htmlFor="password">{dict.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    onChange={handleChange}
                    value={formData.password}
                    placeholder={dict.password}
                    className="pl-10 pr-10 py-6 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{dict.confirmPassword}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    onChange={handleChange}
                    value={formData.confirmPassword}
                    placeholder={dict.confirmPassword}
                    className="pl-10 pr-10 py-6 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button  type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> :  <Eye className="h-5 w-5" /> }
                    </button>
                  </div>
              </div>

                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" className="mt-1" />
                  <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                    {dict.termsOfService}{" "}
                    {dict.and}{" "}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                      {dict.privacyPolicy}
                    </Link>
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox id="newsletter" className="mt-1" />
                  <Label htmlFor="newsletter" className="text-sm text-gray-600">
                    {dict.newsletter}
                  </Label>
                </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-medium">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : dict.submit}
              </Button>
            </form>
           ) : (
           <form onSubmit={handleVerifyOtp} className="space-y-4">
          <Label htmlFor="otp">Enter the 6-digit code</Label>
          <Input
            id="otp" name="otp" type="text"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/, ''))}
            maxLength={6}
            placeholder="123456"
            className="tracking-widest text-center text-lg"
            required
          />
          <Button className='w-full' type="submit" disabled={loading || otp.length < 6}>
            {loading ? 'Verifying…' : 'Verify'}
          </Button>
          <Button className='w-full' type="button" onClick={() => setStep('register')}>
            Back
          </Button>
        </form>
           )}

            {/* Sign In Link */}
            <div className="text-center pt-4">
              <p className="text-gray-600">
                {dict.alreadyHaveAccount}{' '}
                <Link href={`/${lang}/auth/login`} className="text-blue-600 hover:text-blue-700 font-medium">{dict.signIn}</Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>🔒 {dict.secureRegistration}</span>
            <span>•</span>
            <span>🇪🇹 {dict.madeForEthiopia}</span>
            <span>•</span>
            <span>⚡ {dict.quickSetup}</span>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-10 blur-3xl"></div>
      <div className="fixed bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-teal-400 to-blue-400 rounded-full opacity-10 blur-3xl"></div>
    </div>
  )
}
