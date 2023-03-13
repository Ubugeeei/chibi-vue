# chibi-vue

chibi-vue is minimam [Vue.js v3](https://github.com/vuejs/core) core implementations (reaactivity, vnode, component, compiler).

"chibi" means "small" in Japanese.

This project began in February 2023 with the goal of simplifying the understanding of Vue's core implementation.

Currently, I am still in the process of implementation, but after implementation, I intend to post explanatory articles as well.

(For now, I plan to post Japanese first.)

<br/>
<br/>
<br/>

## status

- ✅ Reactive System
  - ✅ reactive
  - ✅ ref
  - ✅ computed
- ✅ Virtual Dom & Renderer
  - ✅ h function
  - ✅ patch rendering
- Component
  - ✅ API
    - ✅ Options API
    - ✅ Composition API
  ✅ lifecycle hooks
    ✅ mounted
  - props / emit
- Template Compiler
  - ✅ directives
    - ✅ v-on
    - v-if
    - v-for
  - ✅ mustache
- Extensions
  - sfc compiler (vite plugin)
    - ⚠️ basic
    - script setup
    - style block
  - store
  - router
