import { lkml } from '../src/lkml.js'

const LookML = new lkml();

console.log("### Testing views, dimensions, and measures ###")
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

console.log("### Testing refinements ###")
out = LookML.load(`
view: tickets {
    label: "foo"
    dimension: test1 {
        label: "Test"
    }
}
view: +tickets {
    label: "baz"
    dimension: test2 {
        label: "Another Test"
    }
}
view: +tickets {
    label: "bar"
}
`)

console.log("### Testing new filters syntax ###")
out = LookML.load(`
view: event {
    measure: filtered {
        label: "A Filtered Measure"
        filters: [created_date: "7 Days", user.status: "-disabled"]
    }
}
`)

str = LookML.dump(out)
console.log(str)