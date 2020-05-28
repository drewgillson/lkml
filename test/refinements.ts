import { lkml } from '../src/lkml.js'
const LookML = new lkml();

let sample = `view: tickets{
  label: "foo"

  dimension: test1{
    label: "Test"
  }
}

view: +tickets{
  label: "baz"

  dimension: test2{
    label: "Another Test"
  }
}

view: +tickets{
  label: "bar"
}`

let out = LookML.load(sample)

test('Testing refinements', () => {
  expect(LookML.dump(out)).toBe(sample);
});