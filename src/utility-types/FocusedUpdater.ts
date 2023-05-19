import { StoreType } from './StoreType'

export type FocusedUpdater<Type extends StoreType> = (
   state: Type['reduxState']
) => Type['reduxState']
