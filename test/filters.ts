import { lkml } from '../src/lkml.js'
const LookML = new lkml();

let out = LookML.load(`
view: event {
    measure: filtered {
        label: "A Filtered Measure"
        filters: [created_date: "7 Days", user.status: "-disabled"]
    }
}
`)

let expected = `view:event{
  measure:filtered{
    label:"A Filtered Measure"
    filters:[created_date:"7 Days",user.status:"-disabled"]
  }
}`
  
test('Testing new filters syntax', () => {
  expect(LookML.dump(out)).toBe(expected);
});