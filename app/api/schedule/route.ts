// app/api/schedule/route.ts
import { forwardToUmbraco } from "@/app/lib/umbraco";

export async function GET(req: Request) {
  return forwardToUmbraco(req, "/api/schedule");
}

export async function POST(req: Request) {
  return forwardToUmbraco(req, "/api/schedule");
}
