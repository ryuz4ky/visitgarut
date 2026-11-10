/** A photo of the surrounding area or an archive photo (not of the place itself) is marked in its credit, so it can be labelled wherever it is shown. */
export const isAreaPhoto=(p:{image_credit?:string|null})=>/^Foto (kawasan|arsip)/i.test(p.image_credit||'')
export const areaPhotoTag=(p:{image_credit?:string|null})=>/^Foto arsip/i.test(p.image_credit||'')?'Foto arsip':'Foto kawasan'
/** Alt text that never presents an area or archive photo as a photo of the place itself. */
export const photoAlt=(p:{name:string;image_credit?:string|null})=>isAreaPhoto(p)?`${(p.image_credit||'').split('/')[0].trim()}, bukan foto ${p.name}`:`Foto ${p.name}`
