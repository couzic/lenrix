import { StoreType } from './StoreType'

// TODO handle key clashes ?
export type StoreDataKey<Type extends StoreType> = keyof (Type['reduxState'] &
   Type['values'] &
   Type['loadableValues'])
