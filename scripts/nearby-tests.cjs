const assert = require('node:assert/strict')
const {hasCoordinates, straightLineKm, nearestPlaces} = require('../.nearby-test/nearby.js')
const origin = {latitude:0,longitude:0}
assert.equal(straightLineKm(origin,origin),0)
assert(Math.abs(straightLineKm(origin,{latitude:0,longitude:1})-111.195)<.01)
for(const p of [{latitude:null,longitude:0},{latitude:91,longitude:0},{latitude:0,longitude:181},{latitude:NaN,longitude:0},{latitude:0,longitude:Infinity}]){
 assert.equal(hasCoordinates(p),false)
 assert.equal(straightLineKm(origin,p),null)
}
const records=[{id:3,latitude:0,longitude:1},{id:2,latitude:0,longitude:.01},{id:1,latitude:0,longitude:.01},{id:4,latitude:null,longitude:0}]
const original=JSON.stringify(records)
assert.deepEqual(nearestPlaces(records,origin,5).map(x=>x.id),[1,2])
assert.equal(JSON.stringify(records),original)
assert.deepEqual(nearestPlaces(records,{latitude:null,longitude:0},5),[])
assert.deepEqual(nearestPlaces(records,origin,NaN),[])
assert.deepEqual(nearestPlaces(records,origin,0),[])
assert.deepEqual(nearestPlaces(records,origin,200).map(x=>x.id),[1,2,3])
const acrossDateline=straightLineKm({latitude:0,longitude:179.99},{latitude:0,longitude:-179.99})
assert(acrossDateline>2&&acrossDateline<3)
console.log('PASS nearby: known distance, radius, stable ties, no mutation, missing/invalid coordinates, and dateline')
