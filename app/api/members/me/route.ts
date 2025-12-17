import { forwardToUmbraco } from "@/app/lib/umbraco";
export async function GET(req: Request) { return forwardToUmbraco(req, "/api/members/me"); }
export async function PUT(req: Request) { return forwardToUmbraco(req, "/api/members/me"); }
