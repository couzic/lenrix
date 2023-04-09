export interface StoreType {
   state: any
   readonlyValues: object
   combinedValues: object
   loadingValues: object
   waitingToBeLoaded: boolean
   actions: object
   dependencies: object
}
