// A tiny module resolution hook, used only by build-snapshot.mjs.
//
// lib/atlas/*.ts files import each other with extensionless relative
// specifiers (e.g. `from "../format"`), which is normal TypeScript/bundler
// style and how Next.js already resolves them fine. Node's native
// TypeScript support (type-stripping, no compile step) can import a .ts
// file directly, but its module resolution is still plain ESM underneath,
// which requires an explicit extension — so an extensionless relative
// import fails with ERR_MODULE_NOT_FOUND when Node (not webpack/SWC) is
// doing the resolving.
//
// Rather than adding `.ts` to every import across lib/atlas/* (touching
// files well outside this script's ownership, purely to satisfy a
// standalone script) or duplicating the fetch logic in plain JS, this hook
// teaches Node's resolver one extra trick: if a relative specifier with no
// extension doesn't resolve, try it again with `.ts` appended. Nothing else
// changes. No new dependency — this uses only Node's built-in loader API.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const HAS_EXTENSION = /\.[a-zA-Z0-9]+$/;

export async function resolve(specifier, context, nextResolve) {
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  if (isRelative && !HAS_EXTENSION.test(specifier)) {
    const asFileUrl = new URL(specifier, context.parentURL);
    for (const ext of [".ts", "/index.ts"]) {
      const candidate = fileURLToPath(asFileUrl) + ext;
      if (existsSync(candidate)) {
        return nextResolve(specifier + ext, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
