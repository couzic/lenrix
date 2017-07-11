import {Lens} from './Lens'

export type ValueUpdater<V> = (V) => V

export type UpdateSpec<T> = object & { [K in keyof T]?: T[K] | ValueUpdater<T[K]> }

export type SetValueCommand<T> = { setValue: T }

export type UpdateCommand<T> = { update: ValueUpdater<T> }

export type UpdateStateCommand<T> = { updateState: UpdateSpec<T> }

export type Command<T> = SetValueCommand<T> | UpdateCommand<T> | UpdateStateCommand<T>

export type FocusOnKeyCommand<State, K extends keyof State> = { focusOn: K, command: Command<State[K]> }

export type FocusWithLensCommand<State, Target, L extends Lens<State, Target>> = { focusWith: L, command: Command<Target> }

export type FocusedUpdateCommand<State, K extends keyof State, Target, L extends Lens<State, Target>> =
    FocusOnKeyCommand<State, K> | FocusWithLensCommand<State, Target, L>

export type UpdateSpecBuilder<T> = (T) => UpdateSpec<T>

export function update<T>(value: T, spec: UpdateSpec<T>): T {
    return value
}