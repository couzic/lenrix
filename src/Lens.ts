export interface Lens<T, TT> {

    focus<K extends keyof TT>(key: K): Lens<T, TT[K]>

    map<TTT>(mapper: (value: TT) => TTT): Lens<T, TTT>

}