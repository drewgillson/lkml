import { lkml } from './lkml.js'

const LookML = new lkml();
let out = LookML.load(`
view: sales {
    sql_table_name: db.sales ;;
    drill_fields: [id]

    dimension: order_number {
        primary_key: yes
        type: string1
        sql: \${TABLE}.id ;;
    }
}
view: sales_products {
    sql_table_name: db.sales_products ;;

    dimension: sku {
        primary_key: yes
        type: string
        sql: \${TABLE}.id ;;
    }

    measure: total_price {
        type: sum
        sql: \${$TABLE}.price ;;
    }

    measure: count {
        type: count
        drill_fields: [sku, account.name, account.id]
    }
}
`)

let str = LookML.dump(out)
console.log(str)
