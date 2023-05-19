import { StoreState } from '../utility-types/StoreState'
import { StoreStateRaw } from '../utility-types/StoreStateRaw'
import { StoreType } from '../utility-types/StoreType'
import { aggregateStatusAndErrors } from './aggregateStatusAndErrors'
import { toData } from './toData'

export const fromRawState = <Type extends StoreType>(
   rawState: StoreStateRaw<Type>
): StoreState<Type> => {
   const data = toData(rawState)
   const { status, errors } = aggregateStatusAndErrors(rawState)
   return { ...rawState, data, errors, status } as any
}
