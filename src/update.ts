export type ValueUpdater<V> = (val: V) => V

export type UpdateSpec<T> = { [K in keyof T]: T[K] | ValueUpdater<T[K]> | UpdateSpec<T[K]> }

export function update<T>(value: T, spec: Partial<UpdateSpec<T>>): T {
    return value
}