import { metaCore } from './meta/meta-core.js';
import { EventBus } from './core/event-bus.js';
import { Orchestrator } from './core/orchestrator.js';
import { BackgroundWorker } from './core/background-worker.js';
import { InterpreterAgent } from './agents/interpreter.js';
import { PlannerAgent } from './agents/planner.js';
import { DeciderAgent } from './agents/decider.js';
import { ResponderAgent } from './agents/responder.js';
import { ReflectorAgent } from './agents/reflector.js';
import { ReflexMatcherAgent } from './agents/reflex-matcher.js';
import { VerifierAgent } from './agents/verifier.js';
import { TaskStore } from './stores/task-store.js';
import { EventStore } from './stores/event-store.js';
import { MemoryStore } from './stores/memory-store.js';
import { BackgroundRunStore } from './stores/background-run-store.js';
import { MemoryService } from './services/memory-service.js';
import { GuardrailService } from './services/guardrail-service.js';
import { RouterService } from './services/router-service.js';
import { ExecutorService } from './services/executor-service.js';
import { ProcessorService } from './services/processor-service.js';
import { ToolRegistry } from './services/tool-registry.js';
import { AdapterRuntime } from './services/adapter-runtime.js';

export function createApp() {
  const taskStore = new TaskStore();
  const eventStore = new EventStore();
  const memoryStore = new MemoryStore();
  const backgroundRunStore = new BackgroundRunStore();
  const eventBus = new EventBus(eventStore);
  const memoryService = new MemoryService(memoryStore);
  const adapterRuntime = new AdapterRuntime();

  const app = {
    metaCore,
    taskStore,
    eventStore,
    memoryStore,
    backgroundRunStore,
    eventBus,
    adapterRuntime,
    backgroundWorker: new BackgroundWorker({
      taskStore,
      memoryService,
      backgroundRunStore,
    }),
    orchestrator: new Orchestrator({
      metaCore,
      taskStore,
      eventBus,
      memoryService,
      guardrailService: new GuardrailService(metaCore),
      routerService: new RouterService(),
      executorService: new ExecutorService(adapterRuntime),
      processorService: new ProcessorService(),
      toolRegistry: new ToolRegistry(),
      interpreter: new InterpreterAgent(),
      planner: new PlannerAgent(),
      decider: new DeciderAgent(),
      responder: new ResponderAgent(),
      reflector: new ReflectorAgent(),
      verifier: new VerifierAgent(),
      reflexMatcher: new ReflexMatcherAgent(),
    }),
  };

  return app;
}
