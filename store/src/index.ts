export * from './types.ts'
export { CONTAINER_TYPES, containerType, containerLabel, type ContainerType } from './containers.ts'
export type { Store } from './store.ts'
export { JsonFileStore } from './json-store.ts'
export { validate, type Issue } from './validate.ts'
export { renderBrief, renderUniverseBrief } from './brief.ts'
export { openUniverse, listUniverses, universesRoot, createUniverse, toUniverseId } from './universes.ts'
export { universeField, type UniverseField } from './universe-fields.ts'

/*
 * The per-container arrays are deliberately not exported. They are the *raw*
 * declarations, without the common fields folded in, and a consumer reading one
 * directly would see a spec the form and the generator never use. `fieldsFor`
 * is the only way to read a spec, and it always returns the composed one.
 */
export { COMMON_FIELDS, composeSpec, type CommonField } from './common-fields.ts'
export { isEmptyValue, type FieldSpec, type FieldKind } from './field-spec.ts'
export { FIELD_SPECS, fieldsFor, fieldIn, containersWithFields } from './fields.ts'
export { draftToItem, itemToDraft, draftToPatch, defaultValues, type ArticleValues } from './article.ts'
export { normalizeTerm, singularize, matchTerm, termExists, type TermMatch } from './terms.ts'
export {
  COMMON_PER_NAME,
  COMMON_SHARE,
  commonShareFor,
  forgeName,
  forgeFullName,
  nameSources,
  sayable,
  type NameBearer,
  type NameKind,
  type NameOptions,
  type Random,
} from './names.ts'
export {
  rollPerson,
  rollFor,
  rollOmissions,
  rollAccepts,
  fillRateOf,
  type RollOptions,
  type Skeleton,
  type RollContext,
} from './skeleton.ts'
export {
  treeOf,
  byFirstYear,
  flatten,
  childrenOf,
  subtree,
  ancestors,
  spanOf,
  yearOf,
  eventsIn,
  isRoot,
  rootTimeline,
  assertValidPlacement,
  type TimelineNode,
  type Span,
} from './timelines.ts'
export { linkify, buildIndex, type Segment, type LinkTarget, type LinkifyOptions } from './linkify.ts'
export { buildImportPlan, type BuildOptions } from './import/azgaar.ts'
export { readAddedLabels, guessGeographyKind, type AddedLabel } from './import/azgaar-svg.ts'
export { TIERS, type Tier, type ImportCandidate, type ImportPlan } from './import/types.ts'
export { saveMapSource, mapSourcePath, frameToAttribute, frameFromAttribute } from './import/media.ts'
export {
  cropSvg,
  relabelCoordinates,
  fitVignette,
  frameBox,
  labelFrame,
  gridSampler,
  growToShore,
  type Box,
} from './import/crop.ts'
export { assess, countBy, digestOf, importedAttributes, DIGEST_KEY } from './import/delta.ts'
export type { Delta, Assessment, Verdict } from './import/delta.ts'
