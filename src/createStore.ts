import { Store } from './Store'
import { LenrixStore } from './LenrixStore'
import { Subject } from 'rxjs/Subject'
import { Updater } from 'immutable-lens'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import 'rxjs/add/operator/scan'
import 'rxjs/add/operator/distinctUntilChanged'

export function createStore<State extends object>(initialState: State): Store<State> {
   const updaters$ = new Subject<Updater<State>>()
   const stateSubject = new BehaviorSubject(initialState)
   updaters$
      .scan((state, updater) => updater(state), initialState)
      .subscribe(stateSubject)
   const state$ = stateSubject.distinctUntilChanged()
   return new LenrixStore(
      state$,
      'root',
      updater => updaters$.next(updater),
      initialState
   )
}
