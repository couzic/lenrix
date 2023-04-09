import { Observable } from 'rxjs'

import { ActionObject } from './ActionObject'

export type Epics<Actions> = {
   [ActionType in keyof Actions]?: (
      payload$: Observable<Actions[ActionType]>
   ) => Observable<ActionObject<Actions>>
}
