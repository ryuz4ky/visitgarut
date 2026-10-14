const assert=require('node:assert/strict');const {buildItinerary}=require('../.planner-test/planner.js');
const places=Array.from({length:12},(_,i)=>({id:i+1,slug:'place-'+i,name:'Place '+i,category:'wisata',district:'Garut',latitude:-7.2+i*.01,longitude:107.9,source_url:'https://example.org/place/'+i,status:'published'}));
places[10].status='draft';places[11].source_url='javascript:alert(1)';
const options={days:3,startId:1,interests:['wisata'],mode:'driving',date:'2026-10-20'};
const plan=buildItinerary(places,options),ids=plan.flatMap(d=>d.stops.map(p=>p.id));assert.equal(plan.length,3);assert.equal(new Set(ids).size,9);assert(!ids.includes(11)&&!ids.includes(12));assert(plan.every(d=>d.mapUrl.startsWith('https://www.google.com/maps/dir/?')));
assert.deepEqual(buildItinerary(places,{...options,startId:999}),[]);assert.deepEqual(buildItinerary(places,{...options,interests:['cafe']}),[]);
const far=[places[0],{...places[1],latitude:-8}];assert.equal(buildItinerary(far,{...options,mode:'walking'})[0].stops.length,1);
console.log('PASS planner: grounded published/source-only places, invalid start, no duplicates, walking distance and map links');

const picked=buildItinerary(places,{...options,selectedIds:[2,5,11,999]});assert.deepEqual(picked.flatMap(d=>d.stops.map(p=>p.id)).sort((a,b)=>a-b),[2,5]);assert.deepEqual(buildItinerary(places,{...options,selectedIds:[]}),[]);console.log('PASS selected itinerary: only selected eligible stops, no unselected origin stop, no draft/unknown fallback');
