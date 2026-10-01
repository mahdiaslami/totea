این دستورالعمل به عنوان یک راهنما برای هوش مصنوعی (Agent) بسیار مهم است، بنابراین بهترین جا برای اضافه کردن آن بخش **Agent Execution Flow** (بخش ۵) و همچنین اشاره‌ای کوتاه در بخش **Component Splitting** (بخش ۳ - قسمت B) است تا Agent دقیقا بداند برای بخش رابط کاربری باید از چه مهارتی استفاده کند.

در ادامه، نسخه به‌روزرسانی شده با اعمال این تغییر آورده شده است:

---

# Architecture Guidelines

## 1. Core Philosophy
- **Pragmatic DDD:** Separate non-reactive business logic (Domain) from reactive UI, but avoid over-engineering. Use Domain concepts (Entities, Services, Repositories) only when complexity demands it. Avoid deep nesting for trivial CRUD.
- **Strict Separation:** Framework-specific reactivity (`ref`, `useState`, `watch`) is strictly forbidden in the domain layer (`modules/`).
- **Rule of 3 (Evolving Structure):** Start with flat directories. Create sub-folders (e.g., `entities/`, `services/`) inside a bounded context **only** when the number of related files exceeds three (3).

## 2. Project Structure
```text
src/
├── modules/           # Pragmatic DDD Core (Non-reactive, Pure TS/JS, Event Dispatchers)
│   ├── [context]/     # Bounded Context (Keep flat until files > 3)
│   └── shared/        # Shared domain logic
├── components/
│   ├── ui/            # Styled components (Dumb visual wrappers, pure UI)
│   └── features/      # Store-aware, domain-specific composite components
├── stores/            # Reactive state management (Conversion point #1)
├── utils/             # http-client.ts, service-container.ts, event-emitter.ts
├── composables/       # Reusable UI reactive logic (Forms, hooks)
├── pages/             # Route-level components (Layout composition)
└── App.vue|.tsx       # Root, initialization, global listeners (Conversion point #2)
```

## 3. The Two Pillars of Architecture

The architecture is strictly divided into two main concerns: **A) Making Business Logic Reactive**, and **B) Component Splitting & Composition**.

### Part A: Making Business Logic Reactive (The Bridge)
There are only **two places** in the application where non-reactive domain logic (`modules/`) is converted into reactive UI state: `stores/` and the root `App.(vue|tsx)`.

- **Event-Driven UI Updates (Priority):** Modules are strictly isolated from UI frameworks. When an event occurs in a module that requires a UI change, the module **dispatches an event**. 
- **The App Component (Entry Point & Global Init):** `App` serves as the starting point of the application. It is responsible for initializations, specifically setting up global listeners for events emitted by the non-reactive layer. 
  - *Example:* Errors occurring in the `http-client` (like 401, 500) dispatch an event. `App.vue/tsx` listens to this event on startup and alters the reactive state to show a global Toast or Snackbar.
- **Stores (Context-Specific Reactivity):** Stores are the second conversion point. They import the DI Container, call Domain Services, and either wrap them in `try/catch` or listen to specific domain events to update the reactive state exposed to local components.

### Part B: Component Splitting & Usage
Component logic must be clearly separated to keep the application maintainable. When designing these layers, the Agent must rely on specific component-building skills (see section 5). UI is constructed using three distinct layers:

- **Pages (`pages/`):** Route-level components. They act as conductors, composing layouts using Features and UI components. Pages must remain thin, contain no direct API calls, and avoid complex business logic.
- **Features (`components/features/`):** Smart components that house domain-specific logic. They connect directly to **stores** to fetch or mutate data. This separates the business-aware logic from the visual presentation.
- **UI Components (`components/ui/`):** Dumb, purely visual components. They only apply visual themes, receive props, and emit events. They know absolutely nothing about stores, services, or business logic.

## 4. Error Handling & Event Strategy
1. **Global/Infrastructure Errors (Event-Driven):** Caught by `http-client` -> Dispatches a global event -> Caught by listener in `App.vue|.tsx` -> Updates reactive state -> Triggers global Toast/Snackbar.
2. **Domain/Validation Errors (400s/Rules):** Thrown by Domain Services -> Caught in **Store**'s `try/catch` -> Mapped to reactive `errorState` -> Displayed by Feature Components.
3. **Form Validation:** Handled reactively via `composables/` before hitting the store or domain layer.

## 5. Agent Execution Flow
When generating or modifying code, strictly follow this pipeline:
1. **Identify Layer:** Business Rule (`modules/`), Event Listener/State (`stores/`, `App`), or Visual Composition (`components/`, `pages/`).
2. **Use Dedicated UI Skills:** When designing, structuring, or generating **Pages** and **Components** (`ui/` or `features/`), you **MUST strictly use the `building-components` skill**. This ensures that the visual structure, layout, and component composition adhere to the designated best practices.
3. **Enforce Pragmatism:** Do not generate unnecessary Repositories/Entities for simple API passes. Apply the "Rule of 3" for folders.
4. **Trace Data Flow & Events:** Backend -> HTTP Client (emits event on fail) -> `modules/` Service -> `stores/` -> `components/features/`.
5. **Never Mix Reactivity:** Ensure zero framework hooks (`useState`, `ref`) exist in `modules/`. If a module needs to affect the UI, it must emit an event or return a result to a Store/App listener.