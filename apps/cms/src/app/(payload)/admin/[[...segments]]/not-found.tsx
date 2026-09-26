import { NotFoundPage, generatePageMetadata } from "@payloadcms/next/views";
import config from "@payload-config";
type Args = { params: Promise<{ segments: string[] }>; searchParams: Promise<Record<string, string | string[]>> };
export const generateMetadata = ({ params, searchParams }: Args) => generatePageMetadata({ config, params, searchParams });
import { importMap } from "../importMap";
export default function NotFound({ params, searchParams }: Args) { return NotFoundPage({ config, params, searchParams, importMap }); }
