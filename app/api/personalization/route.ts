import { forwardToUmbraco } from "@/app/lib/umbraco";

export async function GET(req: Request) {
  return forwardToUmbraco(req, "/api/personalization");
}

export async function PUT(req: Request) {
  return forwardToUmbraco(req, "/api/personalization");
}
