export interface Lens<T, TT> {

    focusOn<K extends keyof TT>(key: K): Lens<T, TT[K]>

    focusWith<TTT>(lens: Lens<TT, TTT>): Lens<T, TTT>

}

export type UnfocusedLens<T> = Lens<T, T>

// export function createLens<T>(): Lens<T, T> {
//     return {} as any
// }