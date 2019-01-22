export type RawAction<Actions> = {
   [ActionType in keyof Actions]: {
      type: ActionType
      payload: Actions[ActionType]
   }
}[keyof Actions]
