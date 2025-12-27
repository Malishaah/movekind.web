// app/api/schedule/[key]/route.ts
import { forwardToUmbraco } from "@/app/lib/umbraco";

export async function PUT(req: Request, ctx: { params: { key: string } }) {
  return forwardToUmbraco(req, `/api/schedule/${encodeURIComponent(ctx.params.key)}`);
}

export async function DELETE(req: Request, ctx: { params: { key: string } }) {
  return forwardToUmbraco(req, `/api/schedule/${encodeURIComponent(ctx.params.key)}`);
}
