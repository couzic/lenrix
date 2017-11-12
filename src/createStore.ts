import { Store } from './Store'
import { Subject } from 'rxjs/Subject'
import { Updater } from 'immutable-lens'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/scan'
import { LenrixStore } from './LenrixStore'

export function createStore<State extends object>(initialState: State): Store<State> {
   const updaters$ = new Subject<Updater<State>>()
   const stateSubject = new BehaviorSubject(initialState)
   updaters$
      .scan((state, updater) => updater(state), initialState)
      .subscribe(stateSubject)
   const state$ = stateSubject.distinctUntilChanged().skip(1)
   return new LenrixStore(
      state$.map(normalizedState => ({ normalizedState, computedValues: {} })),
      data => data.normalizedState,
      { normalizedState: initialState, computedValues: {} },
      updater => updaters$.next(updater),
      'root'
   )
}
