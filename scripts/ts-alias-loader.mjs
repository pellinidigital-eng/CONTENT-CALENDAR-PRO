import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const path = resolvePath(process.cwd(), `${specifier.slice(2)}.ts`);
    return {
      shortCircuit: true,
      url: pathToFileURL(path).href
    };
  }

  return nextResolve(specifier, context);
}
