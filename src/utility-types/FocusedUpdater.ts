import { StoreType } from './StoreType'

export type FocusedUpdater<Type extends StoreType> = (
   state: Type['state']
) => Type['state']
