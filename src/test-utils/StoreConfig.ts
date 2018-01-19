import { StoreOperation } from './StoreOperation'

export interface StoreConfig {
   initialRootState: object
   operations: StoreOperation[]
}
