import Header from "@/components/Header";
import { LoginForm } from "./ClientComponent";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />
      <LoginForm />
    </div>
  );
}
