// export type Selector<State, FieldType> = (state: State) => FieldType
// export type FieldExtractor<State, FieldType> = Selector<State, FieldType> | Lens<State, FieldType>
// export type FieldExtractors<State, ExtractedState> = object & NotAnArray & {[K in keyof ExtractedState]: FieldExtractor<State, ExtractedState[K]>}
