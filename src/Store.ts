import { PlainObject, UnfocusedLens } from 'immutable-lens'
import { Observable } from 'rxjs'

import { IsPlainObject } from './utility-types/IsPlainObject'
import { StoreDataKey } from './utility-types/StoreDataKey'

import { LightStore } from './LightStore'
import { ActionObject } from './utility-types/ActionObject'
import { ActionObservable } from './utility-types/ActionObservable'
import { Epics } from './utility-types/Epics'
import { FocusedHandlers } from './utility-types/FocusedHandlers'
import { LoadableStatus } from './utility-types/LoadableStatus'
import { Match } from './utility-types/Match'
import { PickedLoadedStoreData } from './utility-types/PickedLoadedStoreData'
import { StoreState } from './utility-types/StoreState'
import { StoreType } from './utility-types/StoreType'

type StoreWithValues<Type extends StoreType, NewValues> = Store<{
   reduxState: Type['reduxState']
   values: {
      [P in keyof (Type['values'] & NewValues)]: P extends keyof NewValues
         ? NewValues[P]
         : P extends keyof Type['values']
         ? Type['values'][P]
         : never
   }
   loadableValues: Type['loadableValues']
   actions: Type['actions']
   dependencies: Type['dependencies']
}>

type StoreWithLoadableValues<
   Type extends StoreType,
   NewLoadableValues
> = Store<{
   reduxState: Type['reduxState']
   values: Type['values']
   loadableValues: {
      [P in keyof (Type['loadableValues'] &
         NewLoadableValues)]: P extends keyof NewLoadableValues
         ? NewLoadableValues[P]
         : P extends keyof Type['loadableValues']
         ? Type['loadableValues'][P]
         : never
   }
   actions: Type['actions']
   dependencies: Type['dependencies']
}>

type StoreWithReduxState<Type extends StoreType, ReduxState> = Store<{
   reduxState: PlainObject<ReduxState>
   values: Type['values']
   loadableValues: Type['loadableValues']
   actions: Type['actions']
   dependencies: Type['dependencies']
}>

export interface Store<Type extends StoreType> {
   name?: string

   readonly localLens: UnfocusedLens<Type['reduxState']>
   readonly state$: Observable<StoreState<Type>>
   readonly data$: Observable<StoreState<Type>['data']>
   readonly currentState: StoreState<Type>
   readonly currentStatus: LoadableStatus
   readonly currentData: StoreState<Type>['data']
   readonly currentErrors: Error[]

   readonly action$: ActionObservable<Type['actions']>
   readonly path: string

   ///////////////
   // ACTIVATE //
   /////////////

   onActivate(callback: (store: Store<Type>) => void): Store<Type>
   activate(): void

   //////////////
   // ACTIONS //
   ////////////

   actionTypes<Actions>(): IsPlainObject<Actions> extends true
      ? Store<{
           reduxState: Type['reduxState']
           values: Type['values']
           loadableValues: Type['loadableValues']
           actions: {
              [K in
                 | Exclude<keyof Actions, keyof Type['actions']>
                 | Exclude<
                      keyof Type['actions'],
                      keyof Actions
                   >]: (Type['actions'] & Actions)[K]
           }
           dependencies: Type['dependencies']
        }>
      : never

   updates(
      focusedHandlers: (
         lens: UnfocusedLens<Type['reduxState']>
      ) => FocusedHandlers<Type>
   ): Store<Type>

   updates(focusedHandlers: FocusedHandlers<Type>): Store<Type>

   dispatch(action: ActionObject<Type['actions']>): void

   action<Action extends keyof Type['actions']>(
      action: Action
   ): Type['actions'][Action] extends void | null
      ? () => void
      : (payload: Type['actions'][Action]) => void

   // TODO Implement ?
   // dispatch<ActionType extends keyof Type['actions'], Payload extends Type['actions'][ActionType]>(type: ActionType, payload: Payload): void

   epics(
      epicsBuilder: (store: LightStore<Type>) => Epics<Type['actions']>
   ): Store<Type>

   pureEpics(epics: Epics<Type['actions']>): Store<Type>

   sideEffects(effects: {
      [ActionType in keyof Type['actions']]?: (
         payload: Type['actions'][ActionType],
         store: LightStore<Type>,
         dependencies: Type['dependencies']
      ) => void
   }): Store<Type>

   ///////////
   // READ //
   /////////

   pick<K extends StoreDataKey<Type>>(
      ...keys: K[]
   ): Observable<
      StoreState<{
         reduxState: {
            [RSK in Extract<
               Exclude<
                  keyof Type['reduxState'],
                  keyof Type['values'] | keyof Type['loadableValues']
               >,
               K
            >]: Type['reduxState'][RSK]
         }
         values: {
            [VK in Extract<
               Exclude<keyof Type['values'], keyof Type['loadableValues']>,
               K
            >]: Type['values'][VK]
         }
         loadableValues: {
            [LVK in Extract<
               keyof Type['loadableValues'],
               K
            >]: Type['loadableValues'][LVK]
         }
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>
   >

   ///////////
   // LOAD //
   /////////

   loadFromFields<K extends StoreDataKey<Type>, LoadableValues>(
      fields: K[],
      loaders: {
         [LK in keyof LoadableValues]: (fields: {
            [IK in K]: IK extends keyof Type['loadableValues']
               ? Type['loadableValues'][IK]
               : IK extends keyof Type['values']
               ? Type['values'][IK]
               : IK extends keyof Type['reduxState']
               ? Type['reduxState'][IK]
               : never
         }) => Observable<LoadableValues[LK]>
      }
   ): IsPlainObject<LoadableValues> extends true
      ? StoreWithLoadableValues<Type, LoadableValues>
      : never

   loadFromStream<Input, LoadableValues>(
      input$: Observable<Input>,
      loaders: {
         [LK in keyof LoadableValues]: (
            input: Input
         ) => Observable<LoadableValues[LK]>
      }
   ): IsPlainObject<typeof loaders> extends true // TODO ensure compilation error when passing function
      ? StoreWithLoadableValues<Type, LoadableValues>
      : never

   load<LoadableValues>(loaders: {
      [LK in keyof LoadableValues]: Observable<LoadableValues[LK]>
   }): IsPlainObject<typeof loaders> extends true // TODO ensure compilation error when passing function
      ? StoreWithLoadableValues<Type, LoadableValues>
      : never

   //////////////
   // COMPUTE //
   ////////////

   computeFromFields<
      K extends StoreDataKey<Type>,
      Computers extends Record<
         string,
         (
            pickedFields: {
               [PK in keyof PickedLoadedStoreData<
                  Type,
                  K
               >]: PickedLoadedStoreData<Type, K>[PK]
            },
            store: LightStore<Type>
         ) => any
      >
   >(
      fields: K[],
      computers: Computers
   ): IsPlainObject<Computers> extends false
      ? never
      : Match<K, keyof Type['loadableValues']> extends true
      ? StoreWithLoadableValues<
           Type,
           { [CK in keyof Computers]: ReturnType<Computers[CK]> }
        >
      : StoreWithValues<
           Type,
           { [CK in keyof Computers]: ReturnType<Computers[CK]> }
        >

   computeFromStream<
      Input,
      Computers extends Record<
         string,
         (input: Input, store: LightStore<Type>) => any
      >
   >(
      input$: Observable<Input>,
      computers: Computers
   ): StoreWithLoadableValues<
      Type,
      { [CK in keyof Computers]: ReturnType<Computers[CK]> }
   >

   ////////////
   // FOCUS //
   //////////

   focusFields<K extends StoreDataKey<Type>>(
      ...keys: K[]
   ): Store<{
      actions: Type['actions']
      dependencies: Type['dependencies']
      reduxState: {
         [RSK in Extract<
            Exclude<
               keyof Type['reduxState'],
               keyof Type['values'] | keyof Type['loadableValues']
            >,
            K
         >]: Type['reduxState'][RSK]
      }
      values: {
         [VK in Extract<
            Exclude<keyof Type['values'], keyof Type['loadableValues']>,
            K
         >]: Type['values'][VK]
      }
      loadableValues: {
         [LVK in Extract<
            keyof Type['loadableValues'],
            K
         >]: Type['loadableValues'][LVK]
      }
   }>

   focusFields<K extends StoreDataKey<Type>>(
      keys: K[]
   ): Store<{
      actions: Type['actions']
      dependencies: Type['dependencies']
      reduxState: {
         [RSK in Extract<
            Exclude<
               keyof Type['reduxState'],
               keyof Type['values'] | keyof Type['loadableValues']
            >,
            K
         >]: Type['reduxState'][RSK]
      }
      values: {
         [VK in Extract<
            Exclude<keyof Type['values'], keyof Type['loadableValues']>,
            K
         >]: Type['values'][VK]
      }
      loadableValues: {
         [LVK in Extract<
            keyof Type['loadableValues'],
            K
         >]: Type['loadableValues'][LVK]
      }
   }>

   focusPath<K extends keyof Type['reduxState']>(
      key: K
   ): IsPlainObject<Type['reduxState'][K]> extends false
      ? never
      : StoreWithReduxState<Type, Type['reduxState'][K]>

   focusPath<K extends keyof Type['reduxState']>(
      path: [K]
   ): IsPlainObject<Type['reduxState'][K]> extends false
      ? never
      : StoreWithReduxState<Type, Type['reduxState'][K]>

   focusPath<
      K1 extends keyof Type['reduxState'],
      K2 extends keyof Type['reduxState'][K1]
   >(
      key1: K1,
      key2: K2
   ): IsPlainObject<Type['reduxState'][K1][K2]> extends false
      ? never
      : StoreWithReduxState<Type, Type['reduxState'][K1][K2]>

   focusPath<
      K1 extends keyof Type['reduxState'],
      K2 extends keyof Type['reduxState'][K1]
   >(
      path: [K1, K2]
   ): IsPlainObject<Type['reduxState'][K1][K2]> extends false
      ? never
      : StoreWithReduxState<Type, Type['reduxState'][K1][K2]>

   focusPath<
      RSK extends keyof Type['reduxState'],
      K extends StoreDataKey<Type>
   >(
      path: [RSK],
      keys: K[]
   ): IsPlainObject<Type['reduxState'][RSK]> extends false
      ? never
      : Store<{
           actions: Type['actions']
           dependencies: Type['dependencies']
           reduxState: PlainObject<Type['reduxState'][RSK]>
           values: {
              [VK in Extract<
                 Exclude<
                    keyof Type['reduxState'] | keyof Type['values'],
                    keyof Type['loadableValues']
                 >,
                 K
              >]: VK extends keyof Type['values']
                 ? Type['values'][VK]
                 : VK extends keyof Type['reduxState']
                 ? Type['reduxState'][VK]
                 : never
           }
           loadableValues: {
              [LVK in Extract<
                 keyof Type['loadableValues'],
                 K
              >]: Type['loadableValues'][LVK]
           }
        }>

   focusPath<
      RSK1 extends keyof Type['reduxState'],
      RSK2 extends keyof Type['reduxState'][RSK1],
      K extends keyof (Type['reduxState'] & Type['values'])
   >(
      path: [RSK1, RSK2],
      keys: K[]
   ): IsPlainObject<Type['reduxState'][RSK1][RSK2]> extends false
      ? never
      : Store<{
           actions: Type['actions']
           dependencies: Type['dependencies']
           reduxState: PlainObject<Type['reduxState'][RSK1][RSK2]>
           values: {
              [VK in Extract<
                 Exclude<
                    keyof Type['reduxState'] | keyof Type['values'],
                    keyof Type['loadableValues']
                 >,
                 K
              >]: VK extends keyof Type['values']
                 ? Type['values'][VK]
                 : VK extends keyof Type['reduxState']
                 ? Type['reduxState'][VK]
                 : never
           }
           loadableValues: {
              [LVK in Extract<
                 keyof Type['loadableValues'],
                 K
              >]: Type['loadableValues'][LVK]
           }
        }>
}
