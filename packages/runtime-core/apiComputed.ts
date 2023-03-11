import { computed as _computed } from "../reactivity";

export const computed = ((getter: any) => {
  // @ts-ignore
  return _computed(getter);
}) as typeof _computed;
