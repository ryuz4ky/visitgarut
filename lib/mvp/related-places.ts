// Resolve the published origin in the query so withdrawn pages cannot supply suggestions.
// Spherical dot product decreases with distance; no road-distance claim is made.
export const relatedPlaceSuggestionsSql = `
WITH origin AS (
  SELECT * FROM vg_places WHERE id=$1 AND status='published'
)
SELECT candidate.* FROM vg_places candidate CROSS JOIN origin
WHERE candidate.status='published'
  AND candidate.category=origin.category AND candidate.id<>origin.id
ORDER BY
  CASE WHEN NULLIF(btrim(origin.district),'') IS NOT NULL
    AND lower(btrim(candidate.district))=lower(btrim(origin.district)) THEN 0 ELSE 1 END,
  CASE WHEN origin.latitude BETWEEN -90 AND 90 AND origin.longitude BETWEEN -180 AND 180
    AND candidate.latitude BETWEEN -90 AND 90 AND candidate.longitude BETWEEN -180 AND 180
    THEN sin(radians(origin.latitude))*sin(radians(candidate.latitude))
      +cos(radians(origin.latitude))*cos(radians(candidate.latitude))
        *cos(radians(candidate.longitude-origin.longitude)) END DESC NULLS LAST,
  candidate.name, candidate.id
LIMIT 3`
