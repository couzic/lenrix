import { FieldLenses, UnfocusedLens } from 'immutable-lens'
import { StoreState } from './StoreState'
import { StoreType } from './StoreType'

export type FocusedReadonlySelection<Type extends StoreType, Selection> = (
   lens: UnfocusedLens<{ [K in keyof StoreState<Type>]: StoreState<Type>[K] }>
) => FieldLenses<StoreState<Type>, Selection>
