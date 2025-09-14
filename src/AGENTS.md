# AGENTS.md

## Goal
This repository is a fork of Vuetify 1.5.x.
The goal is to migrate the codebase from Vue 2 (Options API + Mixins) to Vue 3 (Composition API + Composables).

---

## Source Layout
- **Old sources** are under: `packages/vuetify/src/`
  - Components: `packages/vuetify/src/components/`
  - Mixins: `packages/vuetify/src/mixins/`
  - Directives and locale also exist here
- **New sources** go into: `src/`
  - Composables: `src/composables/`
  - Components: `src/components/`

The old source tree will be removed after conversion.

---

## Conventions
- **Mixins → Composables**
  - Each mixin becomes a `useXyz.js` composable in `src/composables/`.
  - Example: `colorable.ts` → `src/composables/useColorable.js`.

- **Components**
  - All components (`VBtn`, `VCard`, etc.) are rewritten using `defineComponent` and Composition API.
  - File names remain the same (`VBtn.vue`, `VCard.vue`).

- **Exports**
  - Default export = the composable or component.

- **Language**
  - Plain JavaScript only, **no TypeScript**.

---

## Build
- Current **webpack config is frozen** and will not be modified.
- After full conversion, the project will switch to **Vite** as build tool.
- Until conversion is complete, **no build or testing** is required.

---

## Process
1. Create new `src/` folder at the repo root.
2. Convert mixins first → `src/composables/`.
3. Gradually update components in `src/components/` to use composables.
4. After all code is moved, remove `packages/vuetify/src/`.
5. Switch build to Vite.

---
