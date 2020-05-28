import { lkml } from '../src/lkml.js'
const LookML = new lkml();

let sample = `view: event{
  measure: filtered{
    label: "A Filtered Measure"
    filters: [created_date: "7 Days", user.status: "-disabled"]
  }
}`
  
let out = LookML.load(sample)

test('Testing new filters syntax', () => {
  expect(LookML.dump(out)).toBe(sample);
});