import { StoreState } from '../utility-types/StoreState'
import { StoreStateRaw } from '../utility-types/StoreStateRaw'
import { StoreType } from '../utility-types/StoreType'

export const toData = <Type extends StoreType>(
   state: StoreStateRaw<Type>
): StoreState<Type>['data'] => {
   const { loadableValues } = state
   const loadableKeys = Object.keys(loadableValues) as Array<
      keyof typeof loadableValues
   >
   const loadedValues = {} as Record<(typeof loadableKeys)[number], any>
   loadableKeys.forEach(key => {
      loadedValues[key] = loadableValues[key].value
   })
   return { ...state.reduxState, ...state.values, ...loadedValues }
}
