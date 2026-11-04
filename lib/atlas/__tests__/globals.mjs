// Runs the Atlas's runner-ready tests with nothing but Node itself:
//
//   npm run atlas:test
//
// The *.test.ts files here (and in lib/atlas/learn/__tests__) are written
// against Jest/Vitest-style globals — describe/test/it/expect — but the
// project has no test dependency. Node can already strip the TypeScript
// types, and node:test supplies describe/test/it. This file adds the last
// two pieces: a small `expect` covering only the matchers these tests use,
// and the same rule scripts/atlas/ts-resolve-hook.mjs teaches Node for
// build-snapshot.mjs — an extensionless relative import tries `.ts`, so
// `from '../hash'` finds hash.ts.
//
// Loaded with `node --import`, before any test file. If a test needs a
// matcher this lacks, it fails loudly with "expect(...).x is not a
// function" — add the matcher here rather than working around it.
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { describe, test, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual, inspect } from 'node:util'

registerHooks({
  resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith('./') || specifier.startsWith('../')
    if (relative && !/\.[a-zA-Z0-9]+$/.test(specifier) && context.parentURL) {
      const base = fileURLToPath(new URL(specifier, context.parentURL))
      for (const ext of ['.ts', '/index.ts']) {
        if (existsSync(base + ext)) return nextResolve(specifier + ext, context)
      }
    }
    return nextResolve(specifier, context)
  },
})

/** Jest's toEqual ignores properties whose value is undefined. */
function stripUndefined(value) {
  if (Array.isArray(value)) return value.map(stripUndefined)
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out = {}
    for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = stripUndefined(v)
    return out
  }
  return value
}

const show = (v) => inspect(v, { depth: 4, breakLength: Infinity })

function matchers(actual) {
  return {
    toBe: (expected) => [Object.is(actual, expected), `${show(actual)} to be ${show(expected)}`],
    toEqual: (expected) => [
      isDeepStrictEqual(stripUndefined(actual), stripUndefined(expected)),
      `${show(actual)} to equal ${show(expected)}`,
    ],
    toBeCloseTo: (expected, digits = 2) => [
      Math.abs(actual - expected) < 10 ** -digits / 2,
      `${actual} to be close to ${expected} (${digits} digits)`,
    ],
    toBeGreaterThan: (n) => [actual > n, `${actual} to be > ${n}`],
    toBeGreaterThanOrEqual: (n) => [actual >= n, `${actual} to be >= ${n}`],
    toBeLessThan: (n) => [actual < n, `${actual} to be < ${n}`],
    toBeLessThanOrEqual: (n) => [actual <= n, `${actual} to be <= ${n}`],
    toBeNull: () => [actual === null, `${show(actual)} to be null`],
    toBeTruthy: () => [Boolean(actual), `${show(actual)} to be truthy`],
    toHaveLength: (n) => [actual?.length === n, `length ${actual?.length} to be ${n}`],
    toMatch: (pattern) => [
      typeof pattern === 'string' ? String(actual).includes(pattern) : pattern.test(String(actual)),
      `${show(actual)} to match ${show(pattern)}`,
    ],
    toContain: (item) => [
      typeof actual === 'string' ? actual.includes(item) : Array.from(actual).includes(item),
      `${show(actual)} to contain ${show(item)}`,
    ],
    toThrow: (expected) => {
      let threw = false
      let error
      try {
        actual()
      } catch (err) {
        threw = true
        error = err
      }
      const message = error instanceof Error ? error.message : String(error)
      const matches =
        expected === undefined ||
        (typeof expected === 'string' && message.includes(expected)) ||
        (expected instanceof RegExp && expected.test(message)) ||
        (typeof expected === 'function' && error instanceof expected)
      return [threw && matches, `function to throw${expected === undefined ? '' : ` ${show(expected)}`}`]
    },
  }
}

function build(actual, negate) {
  const out = {}
  for (const [name, check] of Object.entries(matchers(actual))) {
    out[name] = (...args) => {
      const [pass, description] = check(...args)
      if (pass === negate) throw new Error(`Expected ${negate ? 'not ' : ''}${description}`)
    }
  }
  return out
}

globalThis.describe = describe
globalThis.test = test
globalThis.it = it
globalThis.expect = (actual) => ({ ...build(actual, false), not: build(actual, true) })
