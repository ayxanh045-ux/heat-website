import { CustomerAppLogin } from "@/components/customer-app-login";

export const dynamic = "force-dynamic";

export default function CustomerPortalPage() {
  return (
    <main className="customer-login-page">
      <CustomerAppLogin />
      <div className="customer-login-footer">
        <i /> Bu giriş yalnız müştəri dashboardu üçündür
      </div>
    </main>
  );
}
