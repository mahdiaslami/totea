# Architecture Guidelines

## 1. Core Philosophy
- **Pragmatic DDD:** Separate non-reactive business logic (Domain) from reactive UI, but avoid over-engineering. Use Domain concepts (Entities, Services, Repositories) only when complexity demands it. Avoid deep nesting for trivial CRUD.
- **Strict Separation:** Framework-specific reactivity (`ref`, `useState`, `watch`) is strictly forbidden in the domain layer (`modules/`).
- **Headless UI:** UI logic (Headless) is strictly separated from styling (UI wrappers).
- **Rule of 3 (Evolving Structure):** Start with flat directories. Create sub-folders (e.g., `entities/`, `services/`) inside a bounded context **only** when the number of related files exceeds three (3).

## 2. Project Structure
```text
src/
├── modules/           # Pragmatic DDD Core (Non-reactive, Pure TS/JS)
│   ├── [context]/     # Bounded Context (Keep flat until files > 3)
│   └── shared/        # Shared domain logic
├── components/
│   ├── headless-ui/   # Unstyled logic components (Build only if no 3rd-party lib exists)
│   ├── ui/            # Styled components (Dumb wrappers around headless/3rd-party)
│   └── features/      # Store-aware, domain-specific composite components
├── stores/            # Reactive state management (The ONLY bridge to modules)
├── utils/             # http-client.ts, service-container.ts (Manual DI)
├── composables/       # Reusable UI reactive logic
├── pages/             # Route-level components
└── App.vue|.tsx       # Root, global setup, global error handling
```

## 3. Layer Rules & Data Flow

### A. The Domain Layer (`modules/`)
- Pure TypeScript/JavaScript. No UI framework imports.
- **Application Services** orchestrate logic. For simple APIs, they can call the HTTP client directly. For complex logic, they use **Repositories**.
- Keep context folders flat. Don't create empty `/entities` or `/repositories` folders upfront.

### B. The Reactive Bridge (`stores/`)
- Stores are the **only** layer that interacts with Domain Services.
- **Flow:** Store imports DI Container -> Calls Domain Service -> Wraps in `try/catch` -> Updates reactive state exposed to components.
- No direct API calls or business rules inside stores.

### C. UI & Components (`components/` & `pages/`)
- **Pages** compose layouts using UI and Feature components. No predefined layout wrappers.
- **Features** connect to stores directly to fetch/mutate data, keeping Pages thin.
- **UI Components** only apply visual themes. They contain no business logic.

## 4. Error Handling Strategy
1. **Infrastructure (500s/Network):** Caught by `http-client` -> Handled by `App.vue` -> Triggers global Toast/Snackbar.
2. **Domain/Validation (400s/Rules):** Thrown by Domain Services -> Caught in **Store**'s `try/catch` -> Mapped to reactive `errorState` -> Displayed by Components.
3. **Form Validation:** Handled reactively via `composables/` before hitting the store.

## 5. Agent Execution Flow
When generating or modifying code, strictly follow this pipeAq1line:
1. **Identify Layer:** Business Rule (`modules/`), State (`stores/`), or Visual (`components/`).
2. **Enforce Pragmatism:** Do not generate unnecessary Repositories/Entities for simple API passes. Apply the "Rule of 3" for folders.
3. **Trace Data Flow:** Backend -> HTTP Client -> `modules/` Service -> `stores/` -> `components/features/`.
4. **Never Mix Reactivity:** Ensure zero framework hooks (`useState`, `ref`) exist in `modules/`.