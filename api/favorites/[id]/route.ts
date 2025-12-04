import { forwardToUmbraco } from "@/lib/umbraco";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return forwardToUmbraco(req, `/api/favorites/${params.id}`);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  return forwardToUmbraco(req, `/api/favorites/${params.id}`);
}
