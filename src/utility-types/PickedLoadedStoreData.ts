import { StoreDataKey } from './StoreDataKey'
import { StoreType } from './StoreType'

export type PickedLoadedStoreData<
   Type extends StoreType,
   PickedKey extends StoreDataKey<Type>
> = {
   [K in PickedKey]: K extends keyof Type['loadableValues']
      ? Type['loadableValues'][K]
      : K extends keyof Type['values']
      ? Type['values'][K]
      : K extends keyof Type['reduxState']
      ? Type['reduxState'][K]
      : never
}
