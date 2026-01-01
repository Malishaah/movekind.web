import { forwardToUmbraco } from "@/app/lib/umbraco";
export async function GET(req: Request) { return forwardToUmbraco(req,"/umbraco/delivery/api/v2/content?filter=contentType:workout&expand=properties[$all]"); }

