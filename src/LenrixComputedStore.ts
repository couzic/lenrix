import { ComputedStore } from './ComputedStore'
import { Observable } from 'rxjs/Observable'
import { NotAnArray, Updater } from 'immutable-lens'
import { AsyncValueComputers, ValueComputers } from './Store'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { LenrixAbstractStore } from './LenrixAbstractStore'

export interface ComputedStoreData<NormalizedState extends object & NotAnArray, ComputedValues extends object & NotAnArray> {
   normalizedState: NormalizedState,
   computedValues: ComputedValues
}

export class LenrixComputedStore<NormalizedState extends object & NotAnArray, ComputedValues extends object & NotAnArray, State extends NormalizedState & ComputedValues>
   extends LenrixAbstractStore<NormalizedState, ComputedValues, NormalizedState & ComputedValues>
   implements ComputedStore<NormalizedState, ComputedValues> {

   private readonly dataSubject: BehaviorSubject<ComputedStoreData<NormalizedState, ComputedValues>>
   private readonly stateSubject: BehaviorSubject<State>

   get state$(): Observable<State> {
      return this.stateSubject
   }

   get currentState(): State {
      return this.stateSubject.getValue()
   }

   constructor(private data$: Observable<ComputedStoreData<NormalizedState, ComputedValues>>,
               public readonly path: string,
               updateOnParent: (updater: Updater<NormalizedState>) => void,
               private readonly initialData: ComputedStoreData<NormalizedState, ComputedValues>) {
      super(updateOnParent, initialData.normalizedState)
      this.dataSubject = new BehaviorSubject(initialData)
      const initialState: State = { ...initialData.normalizedState as any, ...initialData.computedValues as any }
      this.stateSubject = new BehaviorSubject(initialState)
      data$.subscribe(this.dataSubject)
      this.dataSubject
         .map(data => ({
            ...data.normalizedState as any,
            ...data.computedValues as any
         }))
         .subscribe(this.stateSubject)
   }

   compute<NewComputedValues>(computer: (state: State) => NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues> {
      throw new Error('Method not implemented.')
   }

   computeValues<NewComputedValues>(values: ValueComputers<State, NewComputedValues>): ComputedStore<NormalizedState, ComputedValues & NewComputedValues> {
      throw new Error('Method not implemented.')
   }

   compute$<NewComputedValues>(computer$: (state$: Observable<State>) => Observable<NewComputedValues>, initialValues: NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues> {
      throw new Error('Method not implemented.')
   }

   computeValues$<NewComputedValues>(values$: AsyncValueComputers<State, NewComputedValues>, initialValues: NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues> {
      throw new Error('Method not implemented.')
   }

}
