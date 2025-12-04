import { forwardToUmbraco } from "@/lib/umbraco";
export async function POST(req: Request) {
  return forwardToUmbraco(req, "/api/members/logout");
}
