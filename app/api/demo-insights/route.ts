import { buildDemoCustomerInsights } from "@/lib/demo-customer-insights";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildDemoCustomerInsights());
}
