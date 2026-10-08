const assert = require('node:assert/strict')
const { buildGlobeNodes, dominantSentiment, globePosition } = require('../.pulse-test/globe.js')
let count = 0
function check(label, fn) { fn(); console.log('PASS '+label); count++ }
const mk = (topic, extra={}) => ({
  topic, label: topic, count: 3, positive: 3, neutral: 0, negative: 0,
  mixed: 0, sourceCount: 3, platformCount: 1, confidence: 'rendah',
  summary: 'Ringkasan terverifikasi', evidenceIds: [1,2,3], sensitive: false,
  ...extra
})
const pulse = (insights=[]) => ({
  insights,
  topicStatuses: insights.map(i=>({ topic:i.topic,label:i.label,count:i.count,
    confidence:i.confidence,sensitive:i.sensitive,evidenceIds:i.evidenceIds,
    missing:null })),
  evidence: [...new Set(insights.flatMap(i=>i.evidenceIds))].map(id=>({id})),
  ratings: [], classified: 3,
  positivePercent: null, lastUpdated: null, windowDays: 90, limited: false
})
check('Empty data never creates fabricated sentiment nodes', () => {
  assert.deepEqual(buildGlobeNodes(pulse()), [])
})
check('An unpublished or insufficient topic cannot become a node', () => {
  assert.equal(buildGlobeNodes(pulse([mk('parkir', {count:2})])).length, 0)
  assert.equal(buildGlobeNodes(pulse([mk('keamanan', {count:5,sensitive:true})])).length, 0)
  assert.equal(buildGlobeNodes(pulse([mk('akses', {evidenceIds:[]})])).length, 0)
  const withheld=pulse([mk('keamanan', {count:6,sensitive:true,evidenceIds:[1,2,3,4,5,6]})])
  withheld.topicStatuses[0].evidenceIds=[1,2,3,4,5]
  assert.equal(buildGlobeNodes(withheld).length,0)
  const hidden=pulse([mk('akses')]); hidden.evidence=[{id:1},{id:2}]
  assert.equal(buildGlobeNodes(hidden).length,0)
})
check('Only eligible insights are mapped and counts refer to unique contributors', () => {
  const nodes=buildGlobeNodes(pulse([mk('pemandangan'),mk('akses',{positive:0,negative:3})]))
  assert.equal(nodes.length,2)
  assert.equal(nodes[0].contributors,3)
  assert.equal(nodes[1].sentiment,'negative')
})
check('Dominant sentiment does not force an ambiguous majority', () => {
  assert.equal(dominantSentiment({positive:2,neutral:1,negative:2,mixed:0}),'mixed')
  assert.equal(dominantSentiment({positive:1,neutral:4,negative:1,mixed:0}),'neutral')
})
check('Projection remains deterministic and bounded', () => {
  const nodes=Array.from({length:10},(_,i)=>globePosition(i,10))
  assert.deepEqual(nodes,Array.from({length:10},(_,i)=>globePosition(i,10)))
  assert.ok(nodes.every(p=>Math.abs(p.x)<=1&&Math.abs(p.y)<=1&&Math.abs(p.depth)<=1))
})
check('Maximum visible node count is 12', () => {
  const xs=Array.from({length:20},(_,i)=>mk('topic'+i))
  assert.equal(buildGlobeNodes(pulse(xs),20).length,12)
})

const {calculatePulse}=require('../.pulse-test/core.js')
const NOW=Date.parse('2026-10-08T12:00:00Z')
const sample=(id,overrides={})=>({
  id, platform:'visitgarut', original_text:'Komentar pengunjung simulasi: panorama indah dan akses yang perlu diperhatikan.',
  display_name:'Simulasi', source_url:'https://visitgarut.com/wisata/uji#pengalaman-'+id,
  published_at:new Date(NOW-86400000).toISOString(), experience_date:null, sentiment:'mixed',
  status:'approved', rights_basis:'first_party', analysis_allowed:true,
  independence_key:'visitor-'+id, is_sensitive:false, verification_reference:'',
  engagement_count:0, expires_at:null, reviewed_at:new Date(NOW).toISOString(),
  topics:[{topic:'pemandangan',sentiment:'positive'},{topic:'akses',sentiment:'negative'}],
  ...overrides,
})
check('Real Pulse aggregation and Globe agree on published independent evidence',()=>{
  const dataset=[sample(1),sample(2),sample(3)]
  const result=calculatePulse(dataset,NOW)
  const nodes=buildGlobeNodes(result)
  assert.equal(nodes.length,2)
  assert.equal(nodes[0].contributors,3)
  assert.equal(nodes[0].sentiment,'positive')
  assert.equal(nodes[1].sentiment,'negative')
  assert.equal(nodes[0].evidenceIds.length,3)
})
check('Sensitive and unreviewed mentions remain invisible with real Pulse calculations',()=>{
  const sensitive=[1,2,3].map(i=>sample(i,{
    is_sensitive:true,verification_reference:'',
    topics:[{topic:'keamanan',sentiment:'negative'}]
  }))
  assert.equal(buildGlobeNodes(calculatePulse(sensitive,NOW)).length,0)
  const unreviewed=[sample(1,{reviewed_at:null}),sample(2),sample(3)]
  assert.equal(buildGlobeNodes(calculatePulse(unreviewed,NOW)).length,0)
})
check('Repeated author does not inflate a Globe node',()=>{
  const rows=[sample(1),sample(2),sample(3,{independence_key:'visitor-1'})]
  assert.deepEqual(buildGlobeNodes(calculatePulse(rows,NOW)),[])
})

console.log(count+' Pulse Globe view-model checks passed')
