export class RouterService {
  route(task) {
    if (task.mode === 'reflex') {
      return ['executor', 'responder'];
    }
    if (task.mode === 'background') {
      return ['executor', 'reflector', 'responder'];
    }
    if (task.mode === 'federated') {
      return ['executor', 'responder'];
    }
    return ['executor', 'responder'];
  }
}
