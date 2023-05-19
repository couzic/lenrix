import { StoreStateRaw } from '../utility-types/StoreStateRaw'
import { StoreStatus } from '../utility-types/StoreStatus'
import { StoreType } from '../utility-types/StoreType'

export const aggregateStatusAndErrors = <Type extends StoreType>(
   state: StoreStateRaw<any>
) => {
   const loadableKeys = Object.keys(state.loadableValues) as Array<
      keyof Type['loadableValues']
   >
   const loadableValues = loadableKeys.map(key => state.loadableValues[key])
   const errors = loadableValues.map(_ => _.error).filter(Boolean) as Error[]
   let error = false
   let loading = false
   loadableValues.forEach(_ => {
      if (_.status === 'error') error = true
      else if (_.status === 'loading') loading = true
   })
   const status: StoreStatus = error ? 'error' : loading ? 'loading' : 'loaded'
   return { status, errors }
}
