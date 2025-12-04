import { forwardToUmbraco } from "@/lib/umbraco";

export async function POST(req: Request) {
  // proxya till din Umbraco-controller: POST /api/members/login
  console.log("Login route called");
  return forwardToUmbraco(req, "/api/members/login");
}
