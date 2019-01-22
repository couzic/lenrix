import { Observable } from 'rxjs'

import { RawAction } from './RawAction'

export type ActionObservable<Actions> = Observable<RawAction<Actions>> & {
   ofType<Action extends keyof Actions>(
      action: Action
   ): Observable<Actions[Action]>
}
