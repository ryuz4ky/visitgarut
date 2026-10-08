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
  insights, topicStatuses: [], evidence: [], ratings: [], classified: 3,
  positivePercent: null, lastUpdated: null, windowDays: 90, limited: false
})
check('Empty data never creates fabricated sentiment nodes', () => {
  assert.deepEqual(buildGlobeNodes(pulse()), [])
})
check('An unpublished or insufficient topic cannot become a node', () => {
  assert.equal(buildGlobeNodes(pulse([mk('parkir', {count:2})])).length, 0)
  assert.equal(buildGlobeNodes(pulse([mk('keamanan', {count:5,sensitive:true})])).length, 0)
  assert.equal(buildGlobeNodes(pulse([mk('akses', {evidenceIds:[]})])).length, 0)
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
console.log(count+' Pulse Globe view-model checks passed')
