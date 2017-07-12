export interface Lens<State, Target> {

    focusOn<K extends keyof Target>(key: K): Lens<State, Target[K]>

    focusWith<NewTarget>(lens: Lens<Target, NewTarget>): Lens<State, NewTarget>

}

export interface Lens1<State, K extends keyof State, T extends State[K]> {
}
export interface Lens2<State, K1 extends keyof State, T1 extends State[K1], K2 extends keyof T1, T2 extends T1[K2]> {
}
export interface Lens3<State, K1 extends keyof State, T1 extends State[K1], K2 extends keyof T1, T2 extends T1[K2], K3 extends keyof T2, T3 extends T2[K3]> {
}

export type UnfocusedLens<T> = Lens<T, T>

// export function createLens<T>(): Lens<T, T> {
//     return {} as any
// }