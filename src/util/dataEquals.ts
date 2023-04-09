import { StoreData } from '../utility-types/StoreData'
import { StoreType } from '../utility-types/StoreType'
import { shallowEquals } from './shallowEquals'

export function dataEquals<Type extends StoreType>(
   previous: StoreData<Type>,
   next: StoreData<Type>
): boolean {
   return (
      previous.status === next.status &&
      shallowEquals(previous.state, next.state) &&
      previous.error === next.error
   )
}
