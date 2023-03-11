export const CREATE_VNODE = Symbol();
export const CREATE_ELEMENT_VNODE = Symbol();
export const WITH_DIRECTIVES = Symbol();
export const TO_DISPLAY_STRING = Symbol();
export const TO_HANDLER_KEY = Symbol();

export const helperNameMap: Record<symbol, string> = {
  [CREATE_VNODE]: `createVNode`,
  [CREATE_ELEMENT_VNODE]: `createElementVNode`,
  [WITH_DIRECTIVES]: `withDirectives`,
  [TO_DISPLAY_STRING]: `toDisplayString`,
  [TO_HANDLER_KEY]: `toHandlerKey`,
};
