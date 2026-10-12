export type TripPlace = {id:number;slug:string;name:string;category:string;district:string;latitude:number|null;longitude:number|null;source_url:string;status:string}
export type TripOptions = {days:number;startId:number;interests:string[];mode:'driving'|'walking';date:string}
export const tripCategories = ['wisata','kuliner','cafe'] as const
export function eligibleTripPlace(p:TripPlace) {
 try {const u=new URL(p.source_url);return p.status==='published' && ['http:','https:'].includes(u.protocol) && !u.username && !u.password && p.latitude!==null && p.longitude!==null && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude)<=90 && Math.abs(p.longitude)<=180} catch {return false}
}
export function distanceKm(a:TripPlace,b:TripPlace) {
 const rad=(n:number)=>n*Math.PI/180;
 const dlat=rad(b.latitude!-a.latitude!),dlon=rad(b.longitude!-a.longitude!);
 const v=Math.sin(dlat/2)**2+Math.cos(rad(a.latitude!))*Math.cos(rad(b.latitude!))*Math.sin(dlon/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(v),Math.sqrt(Math.max(0,1-v)));
}
export function buildItinerary(places:TripPlace[],options:TripOptions) {
 const available=places.filter(eligibleTripPlace);
 const start=available.find(p=>p.id===options.startId);
 if(!start)return [];
 const days=Math.max(1,Math.min(3,Math.floor(options.days)||1));
 let current=start;
 const used=new Set<number>();
 const result:{day:number;stops:TripPlace[];mapUrl:string}[]=[];
 for(let day=1;day<=days;day++){
  const stops:TripPlace[]=[];
  for(let slot=0;slot<3;slot++){
   const candidates=available.filter(p=>!used.has(p.id)&&options.interests.includes(p.category));
   candidates.sort((a,b)=>distanceKm(current,a)-distanceKm(current,b)||a.id-b.id);
   const next=candidates.find(p=>options.mode!=='walking'||distanceKm(current,p)<=3);
   if(!next)break;
   stops.push(next);used.add(next.id);current=next;
  }
  if(!stops.length)break;
  const origin=day===1?start:result.at(-1)!.stops.at(-1)!;
  const query=new URLSearchParams({api:'1',origin:origin.name+' Garut',destination:stops.at(-1)!.name+' Garut',travelmode:options.mode});
  if(stops.length>1)query.set('waypoints',stops.slice(0,-1).map(p=>p.name+' Garut').join('|'));
  result.push({day,stops,mapUrl:'https://www.google.com/maps/dir/?'+query});
 }
 return result;
}
