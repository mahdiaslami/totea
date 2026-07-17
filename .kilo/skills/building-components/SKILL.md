---
name: building-components
description: Use this skill to architect or refactor complex UI elements into granular, logic-driven Compound Components. It decomposes monolithic designs into a scalable structural tree, defines shared state/context, enforces content slots over props, and maps out accessibility (ARIA) attributes. Call this when planning UI primitives or component libraries to ensure a strict separation between UI and business logic.
---

# Building Components

## When to use this skill

- Building new UI components (primitives, components, blocks, templates)
- Refactoring complex or monolithic components into composable architectures

## Architectural Directives

When decomposing a component, you must adhere strictly to the following principles:

### 1. Compound Component Pattern & Context Sharing
- **Rule:** Never generate monolithic structures. Break down complex components into smaller, interconnected parts that share a common state context. 
- **Preference:** Always favor multiple smaller components that share a context (each with their own specific props) over a single monolithic component bloated with excessive props.
- **Framework Implementation:** Shared context is facilitated by the framework's native context APIs. For example, use `provide` and `inject` in Vue, or the Context API and `useContext` in React to share state between the Root and its descendants.
- **Convention:** Use standard structural naming conventions:
  - `Root`: The default top-level component. It manages the shared state and acts as the Context Provider for all its descendants (has no visual output/DOM element on its own).
  - `Provider` *(Optional)*: A context-only wrapper without any DOM representation. 
    - **When to use:** Use this ONLY when the component requires decoupled UI regions to share the same state, and they cannot physically or semantically be nested inside a single `Root` (e.g., a layout where `<XRoot>` and `<XInset>` sit side-by-side but need a shared state: `<XProvider><XRoot /><XInset /></XProvider>`).
  - `Trigger`: The element that handles user interaction (e.g., clicks, key presses) to change the state.
  - `Content`: The container that holds the revealed/hidden structure based on the state.
  - `Item`: Individual interactive nodes inside the content.

### 2. Render Delegation & Content Slots
- **Rule:** Avoid forcing redundant HTML wrappers into the DOM.
- **Action:** Design logical wrappers so they delegate behavior and attributes to their direct children.
- **Strict Constraint:** NEVER use props to pass content. Props are strictly for defining characteristics, configurations, and states. Content MUST always be passed via slots (children).
- **Single Slot Restriction:** Although frameworks like Vue allow a single component to have multiple (named) slots, you MUST NEVER use this feature. Always enforce granular composition by restricting each component to a single default slot (children) to avoid creating monolithic structures.

### 3. Strict Separation of Concerns (UI vs. Features/Pages)
- **UI Components:** Must be completely devoid of business logic and domain-specific types. They should only contain their own internal UI/interaction logic and theme styling.
- **Features & Pages:** Must be completely devoid of low-level UI component logic and theme styling. Their sole responsibility is executing business logic, interacting with stores/state management, and composing/wiring together UI and Feature components.

### 4. Inherent Accessibility (A11y)
- **Rule:** Map out how accessibility is managed at the architectural level.
- **Action:** Define which components are responsible for specific ARIA attributes (e.g., `aria-expanded`, `aria-controls`) and focus management, ensuring these are dynamically tied to the shared state.

### 5. Directory & File Structure
- **Rule:** UI components that share a context must be encapsulated within their own dedicated directory.
- **Naming Convention:** Folder names MUST always be formatted in `kebab-case` (e.g., `date-picker`, `dropdown-menu`).
- **Structure:**
  ```text
  src/
  └── components/
      └── ui/
          └── [component-name]/
              ├── [root and sub-components]
              └── index.(ts|js)              # For exporting all sub-components
  ```

## Execution Constraints (CRITICAL)
- **DO NOT** write framework-specific implementation code (e.g., React, Vue, Angular) unless requested. Keep the output focused on the architectural pattern.
- **DO NOT** mention, import, or write syntax for any specific 3rd-party UI libraries.
- **ONLY** provide the conceptual tree structure, the logical duty of each node, context-sharing rules, and architectural guidelines.

## Expected Output Format

When provided with a UI element to break down, respond EXACTLY in this format:

**1. Component Name:** [Name]

**2. Shared State & Context:** [List of state variables, e.g., isOpen, activeTab, and context scope]

**3. Architecture Tree:**
- `[Component].Provider` *(Only if necessary - Explain why it is needed over Root)*
  - `[Component].Root`: [Explain Logical Duty & State Management]
    - `[Component].Trigger`: [Explain Interaction Duty & Slot Delegation]
    - `[Component].Content`: [Explain Visibility Logic]
      - `[Component].Item`: [Explain Selection Logic]
  - `[Component].Inset` *(If Provider is used)*

**4. File Structure:** 
[Briefly map the files for `src/components/ui/[component-name]/`]

**5. Accessibility & ARIA:** 
[Explain dynamic attributes between Trigger and Content, and focus management]