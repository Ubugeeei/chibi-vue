import { ResolvedOptions } from ".";

export function createDescriptor(
  filename: string,
  source: string,
  { compiler }: ResolvedOptions
) {
  const { descriptor } = compiler.parse(source, {
    filename,
  });

  return { descriptor };
}
