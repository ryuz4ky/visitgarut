import type { Topic } from './core'
export const sourceKinds={authority:'Instansi / lembaga',operator:'Pengelola',report:'Liputan media',directory:'Direktori pemesanan'} as const
export type ResearchEvidence={id:number;topic:Topic;title:string;summary:string;source_url:string;publisher:string;source_kind:keyof typeof sourceKinds;source_published_at:string|null;checked_at:string;limitations:string}
export function researchSourceUrl(value:string){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||!u.hostname.includes('.'))throw new Error('Gunakan sumber publik https.');return u.href}
