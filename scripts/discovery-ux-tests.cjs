// Static smoke checks: these do not replace browser/mobile accessibility QA.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname,'..')
const read = file => fs.readFileSync(path.join(root,file),'utf8')
const mobile = read('components/mvp/MobileNavigation.tsx')
const shell = read('components/mvp/Shell.tsx')
const home = read('app/page.tsx')
const css = read('app/visitgarut2.css')
const layout = read('app/layout.tsx')
let total=0
function test(name,assertion){assertion();console.log('PASS '+name);total++}
test('Mobile navigation only links to implemented public destinations',()=>{
 for(const route of ['/search','/map','/artikel','/community-pulse']){
  assert.ok(mobile.includes("href: '"+route+"'"),route)
  assert.ok(fs.existsSync(path.join(root,'app',route.slice(1),'page.tsx')),route+' page missing')
 }
 assert.doesNotMatch(mobile,/href:\s*['"]\/trip['"]/)
})
test('Mobile nav exposes active-page state',()=>{
 assert.match(mobile,/usePathname\(\)/)
 assert.match(mobile,/aria-current/)
 assert.match(mobile,/aria-label="Navigasi utama seluler"/)
})
test('Primary shell displays mobile navigation and skip content',()=>{
 assert.match(shell,/<MobileNavigation\/>/)
 assert.match(shell,/vg-skip/)
 assert.match(shell,/<main id="konten-utama">/)
})
test('Homepage offers three functional, non-fabricated discovery paths',()=>{
 for(const route of ['/map','/community-pulse','/artikel'])assert.ok(home.includes('<Link href="'+route+'">'))
 assert.match(home,/vg-discovery-choices/)
 assert.match(home,/JsonLd/)
 assert.doesNotMatch(home,/\b(?:rating|review)Count\s*[:=]\s*\d+/)
})
test('Mobile safe-area and accessible reduced motion styling exist',()=>{
 assert.match(css,/\.vg-mobile-nav/)
 assert.match(css,/safe-area-inset-bottom/)
 assert.match(css,/prefers-reduced-motion/)
 assert.match(layout,/import '\.\/visitgarut2\.css'/)
})
console.log(total+' discovery UX static checks passed')
