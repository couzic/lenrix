import {Lens} from './Lens'

export type ValueUpdater<V> = (V) => V

export type UpdateSpec<T> = object & { [K in keyof T]?: T[K] | ValueUpdater<T[K]> }

export type FocusOnKeyAndSetValueCommand<T, K extends keyof T> = { focusOn: K, setValue: T[K] }

export type FocusOnKeyAndUpdateCommand<T, K extends keyof T> = { focusOn: K, update: ValueUpdater<T[K]> }

export type FocusOnKeyAndUpdateStateCommand<T, K extends keyof T> = { focusOn: K, updateState: UpdateSpec<T> }

export type FocusWithLensAndSetValueCommand<T, TT, L extends Lens<T, TT>> = { focusWith: L, setValue: TT }

export type FocusWithLensAndUpdateCommand<T, TT, L extends Lens<T, TT>> = { focusWith: L, update: ValueUpdater<TT> }

export type FocusWithLensAndUpdateStateCommand<T, TT, L extends Lens<T, TT>> = { focusWith: L, updateState: UpdateSpec<TT> }

export type UpdateCommand<T, K extends keyof T, TT, L extends Lens<T, TT>> = FocusOnKeyAndSetValueCommand<T, K>
    | FocusOnKeyAndUpdateStateCommand<T, K>
    | FocusOnKeyAndUpdateCommand<T, K>
    | FocusWithLensAndSetValueCommand<T, TT, L>
    | FocusWithLensAndUpdateStateCommand<T, TT, L>
    | FocusWithLensAndUpdateCommand<T, TT, L>

export type UpdateSpecBuilder<T> = (T) => UpdateSpec<T>

export function update<T>(value: T, spec: UpdateSpec<T>): T {
    return value
}