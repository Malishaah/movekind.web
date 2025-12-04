import { forwardToUmbraco } from "@/lib/umbraco";
export async function GET(req: Request) {
  return forwardToUmbraco(req, "/api/favorites");
}
