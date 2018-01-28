export interface StoreOperation {
   name:
   | 'focusPath'
   | 'focusFields'
   | 'recompose'
   | 'updates'
   | 'epics'
   | 'compute'
   | 'computeFrom'
   | 'computeFromFields'
   | 'compute$'
   | 'computeFrom$'
   | 'computeFromFields$'
   params: any
}
