import { StoreStateRaw } from '../utility-types/StoreStateRaw'
import { StoreType } from '../utility-types/StoreType'
import { shallowEquals } from './shallowEquals'

export function stateEquals<Type extends StoreType>(
   previous: StoreStateRaw<Type>,
   next: StoreStateRaw<Type>
): boolean {
   return (
      shallowEquals(previous.reduxState, next.reduxState) &&
      shallowEquals(previous.values, next.values) &&
      shallowEquals(previous.loadableValues, next.loadableValues) // TODO Dig deeper in each loadable value
   )
}
