const assert=require('node:assert/strict')
const {publicResearchItems,buildResearchGlobeNodes}=require('../.research-globe-test/research-globe.js')
const base={id:1,topic:'fasilitas',title:'Fasilitas pengelola',summary:'Pengelola mencantumkan ruang makan dan musala.',source_url:'https://example.org/facilities',publisher:'Pengelola',source_kind:'operator',source_published_at:null,checked_at:'2026-10-14T00:00:00Z',limitations:'Periksa ketersediaan.'}
const second={...base,id:2,source_url:'https://authority.example.org/place'}
const access={...base,id:3,topic:'akses',summary:'Sumber publik mencantumkan lokasi di wilayah Garut.'}
const invalid=[{...base,id:4,source_url:'javascript:alert(1)'},{...base,id:5,source_url:'https://user:secret@example.org/'},{...base,id:6,checked_at:'invalid'},{...base,id:7,topic:'invented'},{...base,id:8,summary:''}]
const items=[base,{...base,id:9},second,access,...invalid]
assert.equal(publicResearchItems(items).length,3)
const nodes=buildResearchGlobeNodes(items)
assert.equal(nodes.length,2)
const facilities=nodes.find(node=>node.topic==='fasilitas')
assert.equal(facilities.notes,2)
assert.equal(facilities.sourceCount,2)
assert.equal(facilities.items.length,2)
for(const node of nodes){
 assert.ok(Number.isFinite(node.x)&&Number.isFinite(node.y)&&Number.isFinite(node.depth))
 for(const metric of ['sentiment','contributors','positivePercent','confidence'])assert.equal(metric in node,false)
}
assert.deepEqual(buildResearchGlobeNodes([]),[])
assert.deepEqual(buildResearchGlobeNodes(items),nodes)
console.log('PASS research Globe: sourced facts, duplicate removal, safe URLs, source counts, deterministic layout and no visitor sentiment metrics')
