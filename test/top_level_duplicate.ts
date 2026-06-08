import { lkml } from '../src/lkml.js'
const LookML = new lkml();

// A duplicate top-level non-plural key takes last-wins, even after an
// intervening nested block. Regression for container-depth bookkeeping that
// previously left depth elevated, making the second `connection` throw.

test('top-level duplicate non-plural key keeps the last value', () => {
  const src = `connection: "a"

view: v{
  dimension: d{
    sql: \${TABLE}.x ;;
  }
}

connection: "b"`;
  const out: any = LookML.load(src);
  expect(out.connection).toBe('b');
});

test('nested duplicate non-plural key still errors', () => {
  const src = `view: v{
  sql_table_name: a ;;
  sql_table_name: b ;;
}`;
  expect(() => LookML.load(src)).toThrow();
});
