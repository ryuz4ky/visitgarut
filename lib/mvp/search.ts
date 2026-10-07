import { categoryForQuery } from './categories'

export type PlaceSearch = { category?: string; query?: string; district?: string; sort?: string }

export function buildPlacesQuery(options: PlaceSearch = {}) {
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
  const order = options.sort === 'latest' ? 'updated_at DESC, name' : options.sort === 'name' || !query ? 'name' : `CASE WHEN lower(name)=lower($${queryIndex}) THEN 0 WHEN name ILIKE $${queryIndex} || '%' THEN 1 ELSE 2 END, ts_rank(search_vector,plainto_tsquery('simple',$${queryIndex})) DESC, name`
  return { text: `SELECT * FROM vg_places WHERE ${conditions.join(' AND ')} ORDER BY ${order} LIMIT 100`, values }
}
