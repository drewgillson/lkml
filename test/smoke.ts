import { lkml } from '../src/lkml.js'
const LookML = new lkml();

let sample = `view: sales{
  sql_table_name: db.sales ;;
  drill_fields: [id]

  dimension: order_number{
    primary_key: yes
    type: string1
    sql: \${TABLE}.id ;;
  }
}

view: sales_products{
  sql_table_name: db.sales_products ;;

  dimension: sku{
    primary_key: yes
    type: string
    sql: \${TABLE}.id ;;
  }

  measure: total_price{
    type: sum
    sql: \${$TABLE}.price ;;
  }

  measure: count{
    type: count
    drill_fields: [sku, account.name, account.id]
  }
}`

let out = LookML.load(sample)

test('Testing views, dimensions, and measures', () => {
  expect(LookML.dump(out)).toBe(sample);
});