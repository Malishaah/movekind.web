import { forwardToUmbraco } from "@/app/lib/umbraco";
export async function POST(req: Request, { params }: { params: { workoutId: string } }) {
  return forwardToUmbraco(req, `/api/favorites/${params.workoutId}`);
}
export async function DELETE(req: Request, { params }: { params: { workoutId: string } }) {
  return forwardToUmbraco(req, `/api/favorites/${params.workoutId}`);
}
