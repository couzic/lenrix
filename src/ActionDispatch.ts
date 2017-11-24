export type ActionDispatchers<Actions> = {
   [ActionType in keyof Actions]: ActionDispatch<ActionType, Actions[ActionType]>
}

export interface ActionDispatch<ActionType, Payload> {
   (payload: Payload): void
}
