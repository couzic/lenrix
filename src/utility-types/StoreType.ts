export interface StoreType {
   state: any
   readonlyValues: object
   // TODO Add "loadedValues" because if computed from sync (state or readonly) values, the computed value is guaranteed to be present
   actions: object
   dependencies: object
}
