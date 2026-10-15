import { categoryForQuery,categories } from './categories'

export type PlaceSearch = { category?: string; query?: string; district?: string; sort?: string }

function placeSearchParts(options: PlaceSearch = {}) {
  const values: string[] = []
  const conditions = ["status='published'"]
  if (options.category) { values.push(options.category); conditions.push(`category=$${values.length}`) }
  if (options.district) { values.push(options.district); conditions.push(`district=$${values.length}`) }
  const query = options.query?.trim().slice(0, 120)
  let queryIndex = 0
  if (query) {
    values.push(query)
    queryIndex = values.length
    const n = queryIndex
    const matches = [
      `search_vector @@ plainto_tsquery('simple',$${n})`,
      `name ILIKE '%' || $${n} || '%'`,
      `district ILIKE '%' || $${n} || '%'`,
      `array_to_string(aliases,' ') ILIKE '%' || $${n} || '%'`,
    ]
    const category = categoryForQuery(query)
    if (category) { values.push(category); matches.push(`category=$${values.length}`) }
    conditions.push(`(${matches.join(' OR ')})`)
  }
  const order = options.sort === 'latest' ? 'updated_at DESC, name, id' : options.sort === 'name' || !query ? 'name, id' : `CASE WHEN lower(name)=lower($${queryIndex}) THEN 0 WHEN name ILIKE $${queryIndex} || '%' THEN 1 ELSE 2 END, ts_rank(search_vector,plainto_tsquery('simple',$${queryIndex})) DESC, name, id`
  return { where:conditions.join(' AND '), order, values }
}

export const directoryPageSize=12
export function parseDirectoryPage(raw: string|string[]|undefined):number|null {
  if(raw===undefined)return 1
  if(typeof raw!=='string'||!/^\d{1,7}$/.test(raw))return null
  const page=Number(raw)
  return page>=1&&page<=1000000?page:null
}
export function buildPlacesQuery(options:PlaceSearch={}){
  const {where,order,values}=placeSearchParts(options)
  return {text:`SELECT * FROM vg_places WHERE ${where} ORDER BY ${order} LIMIT 100`,values}
}
export function buildDirectoryQueries(options:PlaceSearch={},page=1){
  if(!Number.isInteger(page)||page<1||page>1000000)throw new RangeError('Invalid directory page')
  const {where,order,values}=placeSearchParts(options)
  return {
    count:{text:`SELECT count(*)::int AS total FROM vg_places WHERE ${where}`,values},
    items:{text:`SELECT * FROM vg_places WHERE ${where} ORDER BY ${order} LIMIT $${values.length+1} OFFSET $${values.length+2}`,values:[...values,directoryPageSize,(page-1)*directoryPageSize]}
  }
}
export const directorySummarySql="SELECT district,count(*)::int AS total FROM vg_places WHERE status='published' GROUP BY district ORDER BY district"
export function directoryPageHref(path:string,page:number,filters:PlaceSearch={}){
  const params=new URLSearchParams()
  if(filters.query)params.set('q',filters.query)
  if(filters.category)params.set('category',filters.category)
  if(filters.district)params.set('district',filters.district)
  if(filters.sort&&filters.sort!=='relevant')params.set('sort',filters.sort)
  if(page>1)params.set('page',String(page))
  return params.size?`${path}?${params}`:path
}

export function parseDirectoryFilters(raw:Record<string,string|string[]|undefined>):PlaceSearch{
  return {
    query:typeof raw.q==='string'?raw.q.trim().slice(0,120):'',
    category:typeof raw.category==='string'&&categories.some(c=>c.slug===raw.category)?raw.category:'',
    district:typeof raw.district==='string'?raw.district.slice(0,120):'',
    sort:raw.sort==='latest'?'latest':raw.sort==='name'?'name':'relevant'
  }
}
