import { SFCDescriptor, SFCScriptBlock } from "~/packages/compiler-sfc";
import { ResolvedOptions } from ".";

export function resolveScript(
  descriptor: SFCDescriptor,
  options: ResolvedOptions
): SFCScriptBlock | null {
  if (!descriptor.script) return null;
  let resolved: SFCScriptBlock | null = null;
  resolved = options.compiler.compileScript(descriptor);
  return resolved;
}
