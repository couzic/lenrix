import { SchedulerAction, Subscription } from 'rxjs'
import { AsyncAction } from 'rxjs/internal/scheduler/AsyncAction'
import { AsyncScheduler } from 'rxjs/internal/scheduler/AsyncScheduler'

/* tslint:disable */
export class ImmediateScheduler extends AsyncScheduler {
   protected static frameTimeFactor: number = 10

   public frame: number = 0
   public index: number = -1

   constructor(public maxFrames: number = Number.POSITIVE_INFINITY) {
      super(ImmediateAction, () => this.frame)
   }

   /**
    * Prompt the Scheduler to execute all of its queued actions, therefore
    * clearing its queue.
    * @return {void}
    */
   public flush(): void {
      const { actions, maxFrames } = this
      let error: any, action: AsyncAction<any>

      while (
         (action = actions.shift()!) &&
         (this.frame = action.delay) <= maxFrames
      ) {
         if ((error = action.execute(action.state, action.delay))) {
            break
         }
      }

      if (error) {
         while ((action = actions.shift()!)) {
            action.unsubscribe()
         }
         throw error
      }
   }

   schedule<T>(
      work: (this: SchedulerAction<T>, state?: T) => void,
      delay?: number,
      state?: T
   ): Subscription {
      const subscription = super.schedule(work, delay, state)
      this.flush()
      return subscription
   }
}

class ImmediateAction<T> extends AsyncAction<T> {
   protected active: boolean = true

   constructor(
      protected scheduler: ImmediateScheduler,
      protected work: (this: SchedulerAction<T>, state?: T) => void,
      protected index: number = (scheduler.index += 1)
   ) {
      super(scheduler, work)
      this.index = scheduler.index = index
   }

   public schedule(state?: T, delay: number = 0): Subscription {
      if (!this.id) {
         return super.schedule(state, delay)
      }
      this.active = false
      // If an action is rescheduled, we save allocations by mutating its state,
      // pushing it to the end of the scheduler queue, and recycling the action.
      // But since the VirtualTimeScheduler is used for testing, VirtualActions
      // must be immutable so they can be inspected later.
      const action = new ImmediateAction(this.scheduler, this.work)
      this.add(action)
      return action.schedule(state, delay)
   }

   protected requestAsyncId(
      scheduler: ImmediateScheduler,
      id?: any,
      delay: number = 0
   ): any {
      this.delay = scheduler.frame + delay
      const { actions } = scheduler
      actions.push(this)
      ;(actions as Array<ImmediateAction<T>>).sort(ImmediateAction.sortActions)
      return true
   }

   protected recycleAsyncId(
      scheduler: ImmediateScheduler,
      id?: any,
      delay: number = 0
   ): any {
      return undefined
   }

   protected _execute(state: T, delay: number): any {
      if (this.active === true) {
         return super._execute(state, delay)
      }
   }

   public static sortActions<T>(a: ImmediateAction<T>, b: ImmediateAction<T>) {
      if (a.delay === b.delay) {
         if (a.index === b.index) {
            return 0
         } else if (a.index > b.index) {
            return 1
         } else {
            return -1
         }
      } else if (a.delay > b.delay) {
         return 1
      } else {
         return -1
      }
   }
}
/* tslint:enable */
