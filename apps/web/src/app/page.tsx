import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default function Page(){redirect('/'+(process.env.DEFAULT_LOCALE||'en'));}
