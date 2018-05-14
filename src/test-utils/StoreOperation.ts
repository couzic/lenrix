export interface StoreOperation {
   name:
      | 'focusPath'
      | 'focusFields'
      | 'recompose'
      | 'updates'
      | 'epics'
      | 'sideEffects'
      | 'compute'
      | 'computeFrom'
      | 'computeFromFields'
      | 'compute$'
      | 'computeFrom$'
      | 'computeFromFields$'
   params: any
}
