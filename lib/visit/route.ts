export type RoutePoint={latitude:number;longitude:number}
export function parseRouteIds(value:string|null):number[]|null{
 if(!value||value.length>80)return null
 const parts=value.split(',')
 if(parts.length<2||parts.length>4||parts.some(x=>!(/^(?:-1|[1-9]\d*)$/).test(x)||Number(x)===0||Number(x)<-1||Number(x)>2147483647))return null
 const ids=parts.map(Number)
 return new Set(ids).size===ids.length?ids:null
}
export function parseRoadResponse(raw:unknown,pointCount:number):number[]|null {
 if(!raw||typeof raw!=='object')return null
 const r=raw as {code?:string;routes?:{legs?:{duration?:number}[]}[];waypoints?:{distance?:number}[]}
 if(r.code!=='Ok'||!Array.isArray(r.waypoints)||r.waypoints.length!==pointCount||r.waypoints.some(w=>typeof w.distance!=='number'||!Number.isFinite(w.distance)||w.distance<0||w.distance>1500))return null
 const legs=r.routes?.[0]?.legs
 if(!Array.isArray(legs)||legs.length!==pointCount-1||legs.some(l=>typeof l.duration!=='number'||!Number.isFinite(l.duration)||l.duration<0||l.duration>86400))return null
 return legs.map(l=>Math.ceil(l.duration!/60))
}
