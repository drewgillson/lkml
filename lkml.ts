import { Lexer } from "./lexer"
import { Parser } from "./parser"
import { Serializer } from "./serializer"

export class lkml {
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