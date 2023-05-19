import { StoreStateRaw } from '../utility-types/StoreStateRaw'
import { StoreType } from '../utility-types/StoreType'

export const isLoaded = <Type extends StoreType>(
   state: StoreStateRaw<Type>
): boolean => {
   let loaded = true
   const loadableKeys = Object.keys(state.loadableValues) as Array<
      keyof Type['loadableValues']
   >
   loadableKeys.forEach(key => {
      if (state.loadableValues[key].status !== 'loaded') {
         loaded = false
         return
      }
   })
   return loaded
}
