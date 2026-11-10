/** A photo of the surrounding area or an archive photo (not of the place itself) is marked in its credit, so it can be labelled wherever it is shown. */
export const isAreaPhoto=(p:{image_credit?:string|null})=>/^Foto (kawasan|arsip)/i.test(p.image_credit||'')
export const areaPhotoTag=(p:{image_credit?:string|null})=>/^Foto arsip/i.test(p.image_credit||'')?'Foto arsip':'Foto kawasan'
