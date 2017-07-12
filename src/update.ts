import {Lens} from './Lens'

export type ValueUpdater<V> = (V) => V

export type UpdateSpec<T> = object & { [K in keyof T]?: T[K] | ValueUpdater<T[K]> }

export type SetValueCommand<T> = { setValue: T }

export type UpdateCommand<T> = { update: ValueUpdater<T> }

export type UpdateStateCommand<T> = { updateState: UpdateSpec<T> }

export type Command<T> = SetValueCommand<T> | UpdateCommand<T> | UpdateStateCommand<T>

export type FocusedCommand<State, Target> = { focus: Lens<State, Target> } & Command<Target>

// export function update<T>(value: T, spec: UpdateSpec<T>): T {
//     return value
// }