import { StoreDataKey } from '../utility-types/StoreDataKey'
import { PickedStateRaw, StoreStateRaw } from '../utility-types/StoreStateRaw'
import { StoreType } from '../utility-types/StoreType'

export const pickRawState = <
   Type extends StoreType,
   K extends StoreDataKey<Type>
>(
   state: StoreStateRaw<Type>,
   keys: K[]
): PickedStateRaw<Type, K> => {
   const reduxState = {} as any
   const values = {} as any
   const loadableValues = {} as any
   keys.forEach(key => {
      if (key in state.loadableValues) {
         loadableValues[key] = state.loadableValues[key]
      } else if (key in state.values) {
         values[key] = state.values[key]
      } else if (key in state.reduxState) {
         reduxState[key] = state.reduxState[key]
      }
   })
   return {
      reduxState,
      values,
      loadableValues
   } as PickedStateRaw<any, any>
}
