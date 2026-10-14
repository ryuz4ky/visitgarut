import {publicEvidenceGate,sensitivePgExpression} from './archive-query'

// Badge visibility follows the same current publication gates as the drawer.
export const hubExperienceCountSql = `(SELECT count(*)::int FROM vg_social_mentions m
 WHERE m.place_id=p.id AND m.platform='visitgarut' AND ${publicEvidenceGate(1,2)})`
export const hubExperienceParams = [sensitivePgExpression,false] as const
