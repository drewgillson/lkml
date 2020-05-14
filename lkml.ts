import { Lexer } from "./lexer"
import { Parser } from "./parser"

class LookML {
    load(text: string): Object {
        /* Parse LookML into a Javascript object.
        Args:
            text: String containing LookML to be parsed */

        let lexer = new Lexer(text)
        let tokens = lexer.scan()
        //console.log(tokens)
        let parser = new Parser(tokens)
        let result = parser.parse()
        return(result)
    }

    dump(obj: Object): string {
        /* Serialize a Javascript object into LookML.
        Args:
            obj: The Javascript object to be serialized to LookML
        Returns:
            A LookML string */
        return("a string")
    }
}

const lkml = new LookML();
/*
    sql_table_name: salesforce.tasks ;;
    drill_fields: [id]

    dimension: id1 {
        primary_key: yes
        type: string1
        sql: \${TABLE}.id ;;
    }

    dimension: id2 {
        primary_key: yes
        type: string2
        sql: \${TABLE}.id ;;
    }

    measure: count {
        type: count
        drill_fields: [id, account.name, account.id]
    }
*/
let out = lkml.load(`
view: a {
    sql_table_name: a ;;
    drill_fields: [id]

    dimension: id1 {
        primary_key: yes
        type: string1
        sql: \${TABLE}.id ;;
    }
    measure: count {
        type: count
    }
}
view: b {
    sql_table_name: b ;;
    dimension: id2 {
        primary_key: yes
        type: string2
        sql: \${TABLE}.id ;;
    }
}`)

console.log(out)
//console.log(out['views'][1]['dimensions']);