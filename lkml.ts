import { Lexer } from "./lexer"
import { Parser } from "./parser"
import { Serializer } from "./serializer"

class LookML {
    load(text: string): Object {
        /* Parse LookML into a Javascript object.
        Args:
            text: String containing LookML to be parsed */

        let lexer = new Lexer(text)
        let tokens = lexer.scan()
        let parser = new Parser(tokens)
        let result = parser.parse()
        return result
    }

    dump(obj: Object): string {
        /* Serialize a Javascript object into LookML.
        Args:
            obj: The Javascript object to be serialized to LookML
        Returns:
            A LookML string */

        let serializer = new Serializer()
        let result = serializer.serialize(obj)
        return result
    }
}

const lkml = new LookML();
let out = lkml.load(`
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

let str = lkml.dump(out)
console.log(str)
