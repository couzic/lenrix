export type ActionDispatchers<Actions> = {
   [ActionType in keyof Actions]: (payload: Actions[ActionType]) => void
}
