import { lkml } from '../src/lkml.js'
const LookML = new lkml();

// Regression tests: unterminated quoted literals / expression blocks used to
// hang the lexer (it ran off the end of the string); they must now throw.

test('unterminated quoted literal throws instead of hanging', () => {
  expect(() => LookML.load(`view: v{ label: "unterminated }`)).toThrow();
});

test('unterminated expression block throws instead of hanging', () => {
  expect(() => LookML.load(`view: v{ sql: SELECT 1`)).toThrow();
});

test('well-formed quoted literal and expression block still parse', () => {
  let out: any = LookML.load(`view: v{ label: "ok" sql: \${TABLE}.id ;; }`);
  expect(out.views[0].label).toBe('ok');
  expect(out.views[0].sql).toBe('${TABLE}.id');
});
