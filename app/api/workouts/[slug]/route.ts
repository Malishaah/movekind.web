import { forwardToUmbraco } from "@/app/lib/umbraco";
export async function GET(req: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;  return forwardToUmbraco(req,`umbraco/delivery/api/v2/content/item/${slug}?expand=properties[$all]`); }

