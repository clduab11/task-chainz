import { BigInt } from "@graphprotocol/graph-ts"
import {
  TaskCreated,
  TaskAssigned,
  TaskSubmitted,
  TaskCompleted,
  TaskCancelled,
  DisputeCreated,
  DisputeResolved
} from "../generated/TaskBounty/TaskBounty"
import { Task, User, Dispute } from "../generated/schema"

function getOrCreateUser(address: string): User {
  let user = User.load(address)
  if (user == null) {
    user = new User(address)
    user.totalEarned = BigInt.fromI32(0)
    user.tasksCompleted = 0
    user.save()
  }
  return user
}

export function handleTaskCreated(event: TaskCreated): void {
  const task = new Task(event.params.param0.toString())
  task.taskId = event.params.param0
  task.creator = getOrCreateUser(event.params.param1.toHexString()).id
  task.title = ""
  task.descriptionHash = ""
  task.bounty = event.params.param2
  task.status = "Open"
  task.createdAt = event.block.timestamp
  task.deadline = event.params.param3
  task.fundsReleased = false
  task.save()
}

export function handleTaskAssigned(event: TaskAssigned): void {
  const task = Task.load(event.params.param0.toString())
  if (task != null) {
    task.assignee = getOrCreateUser(event.params.param1.toHexString()).id
    task.status = "Assigned"
    task.save()
  }
}

export function handleTaskSubmitted(event: TaskSubmitted): void {
  const task = Task.load(event.params.param0.toString())
  if (task != null) {
    task.status = "Submitted"
    task.save()
  }
}

export function handleTaskCompleted(event: TaskCompleted): void {
  const task = Task.load(event.params.param0.toString())
  if (task != null) {
    task.status = "Completed"
    task.completedAt = event.block.timestamp
    task.fundsReleased = true
    task.save()

    // Update user stats
    const user = User.load(event.params.param1.toHexString())
    if (user != null) {
      user.totalEarned = user.totalEarned.plus(event.params.param2)
      user.tasksCompleted = user.tasksCompleted + 1
      user.save()
    }
  }
}

export function handleTaskCancelled(event: TaskCancelled): void {
  const task = Task.load(event.params.param0.toString())
  if (task != null) {
    task.status = "Cancelled"
    task.fundsReleased = true
    task.save()
  }
}

export function handleDisputeCreated(event: DisputeCreated): void {
  const dispute = new Dispute(event.params.param0.toString())
  dispute.disputeId = event.params.param0
  dispute.task = event.params.param1.toString()
  dispute.initiator = getOrCreateUser(event.params.param2.toHexString()).id
  dispute.reason = ""
  dispute.createdAt = event.block.timestamp
  dispute.resolved = false
  dispute.save()

  // Update task status
  const task = Task.load(event.params.param1.toString())
  if (task != null) {
    task.status = "Disputed"
    task.save()
  }
}

export function handleDisputeResolved(event: DisputeResolved): void {
  const dispute = Dispute.load(event.params.param0.toString())
  if (dispute != null) {
    dispute.resolved = true
    dispute.winner = getOrCreateUser(event.params.param1.toHexString()).id
    dispute.save()
  }
}
