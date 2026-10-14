import {hasCoordinates,type Coordinates} from './nearby'
export type CoordinateReference = Coordinates & {source_url:string;publisher:string;checked_at:string;note:string}
export function publicCoordinateReference(place:Coordinates & {coordinate_reference?:unknown}):CoordinateReference|null {
  const raw=place.coordinate_reference
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||!hasCoordinates(place))return null
  const r=raw as Record<string,unknown>
  if(r.latitude!==place.latitude||r.longitude!==place.longitude||typeof r.source_url!=='string'||typeof r.publisher!=='string'||!r.publisher.trim()||typeof r.checked_at!=='string'||!Number.isFinite(Date.parse(r.checked_at))||typeof r.note!=='string')return null
  try{const u=new URL(r.source_url);if(u.protocol!=='https:'||u.username||u.password)return null}catch{return null}
  return {latitude:place.latitude,longitude:place.longitude,source_url:r.source_url,publisher:r.publisher,checked_at:r.checked_at,note:r.note}
}
