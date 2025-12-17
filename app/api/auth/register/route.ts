import { forwardToUmbraco } from "@/app/lib/umbraco";
export async function POST(req: Request) { return forwardToUmbraco(req, "/api/members/register"); }
