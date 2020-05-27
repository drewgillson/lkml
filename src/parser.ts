// Parses a sequence of tokenized LookML into a Javacript object.

import * as tokens from "./tokens"
import { PLURAL_KEYS } from "./keys"

declare global {
    interface String {
        repeat(c: number): string;
    }
    interface ObjectConstructor {
        assign(...objects: Object[]): Object;
    }
}

// Delimiter character used during logging to show the depth of nesting
const DELIMITER: string = ". "
const DEBUG = false

export class Parser {
    /* Parses a sequence of tokenized LookML into a Javascript object.
    This parser is a recursive descent parser which uses the grammar listed below (in
    PEG format). Each grammar rule aligns with a corresponding method (e.g.
    parse_expression).
    Attributes:
        tokens: A sequence of tokens
        index: The position in the token sequence being evaluated
        progress: The farthest point of progress during parsing
        depth: The level of recursion into nested expressions
        log_debug: A flag indicating that debug messages should be logged. This flag
            exits to turn off logging flow entirely, which provides a small
            performance gain compared to parsing at a non-debug logging level.
    Grammar:
        expression ← (block / pair / list)*
        block ← key literal? "{" expression "}"
        pair ← key value
        list ← key "[" csv? "]"
        csv ← (literal / quoted_literal) ("," (literal / quoted_literal))* ","?
        value ← literal / quoted_literal / expression_block
        key ← literal ":"
        expression_block ← [^;]* ";;"
        quoted_literal ← '"' [^\"]+ '"'
        literal ← [0-9A-Za-z_]+
    */

    tokens: object
    index: number
    progress: number
    depth: number
    log_debug: boolean

    constructor(stream: object) {
        /* Initializes the Parser with a stream of tokens and sets the index.
        Args:
            stream: Lexed sequence of tokens to be parsed
        Raises:
            TypeError: If an object in the stream is not a valid token */

        for (const key in stream) {
            let token = stream[key];
            if (!(token as tokens.Token).id) {
                throw new TypeError("Token is not a valid token type.")
            }
        }
        this.tokens = stream
        this.index = 0
        this.progress = 0
        this.depth = -1
        this.log_debug = DEBUG
    }

    backtrack(mark: number): void {
        // Backtrack to a previous position on failure.
        if (this.index > this.progress) {
            this.progress = this.index
        }
        this.jump_to_index(mark)
    }

    jump_to_index(index: number): void {
        // Sets the parser index to a specified value.
        this.index = index
    }

    get_depth(): number {
        return (this.depth > 0 ? this.depth : 1)
    }

    peek(): any {
        // Returns the token at the current index.
        return this.tokens[this.index]
    }

    advance(length: number = 1): void {
        /* Moves the index forward by n characters.
        Args:
            length: The number of positions forward to move the index. */

        this.index += length
    }

    consume() {
        // Returns the current index character and advances the index by 1 token.
        this.advance()
        return this.tokens[this.index - 1]
    }

    consume_token_value() {
        // Returns the value of the current index token, advancing the index 1 token.
        let token = this.consume()
        return token.chars
    }

    check(...input_tokens: any): boolean {
        /* Compares the current index token type to specified token types.
        Args:
            *token_types: A variable number of token types to check against
        Raises:
            TypeError: If one or more of the token_types are not actual token types
        Returns:
            bool: True if the current token matches one of the token_types */

        if (this.peek()) {

            if (this.log_debug) {
                console.log(DELIMITER.repeat(this.get_depth()) + "Check " + this.peek().id)
            }

            // Determine if input_tokens are valid Tokens
            let valid_tokens: number = 0
            for (let type_key in tokens.tokenTypes) {
                let token_type = tokens.tokenTypes[type_key];
                for (let token_key in input_tokens) {
                    let token = input_tokens[token_key]
                    if (token_type.name == token.name) {
                        valid_tokens++
                        break
                    }
                }
            }
            if (valid_tokens != input_tokens.length) {
                throw new TypeError("Input contained invalid token types.")
            }

            // Determine if the current token is one of the desired input_tokens
            for (let token_key in input_tokens) {
                let token = input_tokens[token_key]
                if (this.peek().name == token.name) {
                    return true
                }
            }
        }

        return false
    }

    parse(): object {
        // Main method of this class and a wrapper for the expression parser.

        return this.parse_expression()
    }

    update_tree(target: object, update: object) {
        /* Add one object to an existing object, handling certain repeated keys.
        This method is primarily responsible for handling repeated keys in LookML like
        `dimension` or `set`, which can exist more than once in LookML but cannot be
        repeated in a Javascript object.
        This method checks the list of valid repeated keys and combines the values of
        that key in `target` and/or `update` into a list and assigns a plural key (e.g.
        `dimensions` instead of `dimension`).
        Args:
            target: Existing object of parsed LookML
            update: New object to be added to target
        Raises:
            KeyError: If `update` has more than one key
            KeyError: If the key in `update` already exists and would overwrite existing */

        let keys = Object.keys(update)
        if (keys.length > 1) {
            throw new Error("Dictionary to update with cannot have multiple keys.")
        }
        let key = keys[0]
        if (typeof(key) == 'string') {
            let stripped_key = key.replace(/s$/, '');

            if (PLURAL_KEYS.indexOf(stripped_key) != -1) {
                let plural_key = stripped_key + "s"
                if (Object.keys(target).indexOf(plural_key) != -1) {
                    target[plural_key].push(update[key])
                }
                else {
                    target[plural_key] = []
                    target[plural_key].push(update[key])
                }
            }
            else if (Object.keys(target).indexOf(key) != -1) {
                if (this.depth == 0) {
                    console.log("Multiple declarations of top-level key " + key + " found. Using the last-declared value.")
                    target[key] = update[key]
                }
                else {
                    throw new Error("Key " + key + " already exists in tree and would overwrite the existing value.")
                }
            }
            else {
                target[key] = update[key]
            }
        }
    }

    parse_expression(): object {
        /* Returns a parsed LookML object from a sequence of tokens.
        Raises:
            SyntaxError: If unable to find a matching grammar rule for the stream
        Grammar:
            expression ← (block / pair / list)* */
        
        let mark = this.index
        this.depth += 1

        if (this.log_debug) {
            let grammar = "[expression] = (block / pair / list)*"
            console.log(DELIMITER.repeat(this.get_depth()) + "Try to parse " + grammar)
        }
        let expression = {}
        if (this.check(tokens.StreamStartToken)) {
            this.advance()
        }
        while (!this.check(tokens.StreamEndToken, tokens.BlockEndToken)) {

            let block = this.parse_block()
            if (block) {
                this.update_tree(expression, block)
                continue
            }

            let pair = this.parse_pair()
            if (pair) {
                this.update_tree(expression, pair)
                continue
            }

            let list = this.parse_list()
            if (list) {
                expression = Object.assign(expression, list)
                continue
            }

            let token = this.tokens[this.progress]
            throw new SyntaxError("Unable to find a matching expression for " + token.id + " on line " + token.line_number)
        }

        if (this.log_debug) {
            console.log(DELIMITER.repeat(this.get_depth()) + "Successfully parsed expression.")
        }

        if (!expression) {
            this.depth -= 1
            this.backtrack(mark)
        }

        return expression
    }

    parse_block() {
        /* Returns an object that represents a LookML block or false if the grammar doesn't match
        Grammar:
            block ← key literal? "{" expression "}"
        Examples:
            Input (before tokenizing into a stream):
            ------
            "dimension: dimension_name {
                label: "Dimension Label"
                sql: ${TABLE}.foo ;;
            }"
            Output (object):
            -------
            {
                "name": "dimension_name",
                "label": "Dimension Label",
                "sql": "${TABLE}.foo"
            } */

        let mark = this.index
        this.depth += 1
    
        if (this.log_debug) {
            let grammar = "[block] = key literal? '{' expression '}'"
            console.log(DELIMITER.repeat(this.get_depth()) + "Try to parse " + grammar)
        }
        let key = this.parse_key()
        if (!key) {
            return key
        }

        let literal = ""
        if (this.check(tokens.RefinementToken)) {
            this.advance()
            literal = "+"
        }

        if (this.check(tokens.LiteralToken)) {
            literal += this.consume_token_value()
        }

        if (this.check(tokens.BlockStartToken)) {
            this.advance()
        }
        else {
            this.depth -= 1
            this.backtrack(mark)
            return false
        }

        let expression = this.parse_expression()

        if (this.check(tokens.BlockEndToken)) {
            this.advance()

            let block = {};
            block[key] = expression
            if (literal) {
                block[key]["name"] = literal
            }

            if (this.log_debug) {
                console.log(DELIMITER.repeat(this.get_depth()) + "Successfully parsed block.")
            }
            return block
        }
        else {
            this.depth -= 1
            this.backtrack(mark)
            return false
        }
    }

    parse_pair() {
        /* Returns an object that represents a LookML key/value pair.
        Returns:
            An object with the parsed block or false if the grammar doesn't match
        Grammar:
            pair ← key value
        Examples:
            Input (before tokenizing into a stream):
            ------
            label: "Foo"
            Output (object):
            -------
            {"label": "Foo"} */

        let mark = this.index
        this.depth += 1

        if (this.log_debug) {
            let grammar = "[pair] = key value"
            console.log(DELIMITER.repeat(this.get_depth()) + "Try to parse " + grammar)
        }

        let key = this.parse_key()
        let value = this.parse_value()
        if (!key || !value) {
            this.depth -= 1
            this.backtrack(mark)
            return false
        }

        let pair = {}
        pair[key] = value
        if (this.log_debug) {
            console.log(DELIMITER.repeat(this.get_depth()) + "Successfully parsed pair.")
        }
        return pair
    }

    parse_key() {
        /* Returns a string that represents a literal key.
        Returns:
            An object with the parsed block or None if the grammar doesn't match
        Grammar:
            key ← literal ":"
        Examples:
            Input (before tokenizing into a stream)::
            ------
            label:
            Output (string):
            -------
            "label" */

        let mark = this.index
        this.depth += 1
    
        let key: string = ""
        if (this.log_debug) {
            let grammar = "[key] = literal ':'"
            console.log(DELIMITER.repeat(this.get_depth()) + "Try to parse " + grammar)
        }
        if (this.check(tokens.LiteralToken)) {
            key = this.consume_token_value()
        }
        else {
            this.depth -= 1
            this.backtrack(mark)
            return false
        }
        if (this.check(tokens.ValueToken)) {
            this.advance()
        }
        else {
            this.depth -= 1
            this.backtrack(mark)
            return false
        }

        if (this.log_debug) {
            console.log(DELIMITER.repeat(this.get_depth()) + "Successfully parsed key.")
        }
        return key
    }

    parse_value() {
        /* Returns a string that represents a value.
        Returns:
            A string with the parsed value or None if the grammar doesn't match
        Grammar:
            value ← literal / quoted_literal / expression_block
        Examples:
            Input (before tokenizing into a stream):
            ------
            1) "Foo"
            2) "${TABLE}.foo ;;"
            Output (string):
            -------
            1) "Foo"
            2) "${TABLE}.foo" */

        let mark = this.index
        this.depth += 1
    
        if (this.log_debug) {
            let grammar = "[value] = literal / quoted_literal / expression_block"
            console.log(DELIMITER.repeat(this.get_depth()) + "Try to parse " + grammar)
        }
        if (this.check(tokens.QuotedLiteralToken, tokens.LiteralToken)) {
            let value = this.consume_token_value()
            if (this.log_debug) {
                console.log(DELIMITER.repeat(this.get_depth()) + "Successfully parsed value.")
            }
            return value
        }
        else if (this.check(tokens.ExpressionBlockToken)) {
            let value = this.consume_token_value()
            if (this.check(tokens.ExpressionBlockEndToken)) {
                this.advance()
            }
            else {
                this.depth -= 1
                this.backtrack(mark)    
                return false;
            }
            if (this.log_debug) {
                console.log(DELIMITER.repeat(this.get_depth()) + "Successfully parsed value.")
            }
            return value
        }
        else {
            this.depth -= 1
            this.backtrack(mark)
            return false
        }
    }

    parse_list() {
        /* Returns a dictionary that represents a LookML list.
        Returns:
            A dictionary with the parsed list or None if the grammar doesn't match
        Grammar:
            list ← key "[" csv? "]"
        Examples:
            Input (before tokenizing into a stream):
            ------
            "timeframes: [date, week]"
            Output (dictionary):
            -------
            {"timeframes": ["date", "week"]} */

        let mark = this.index
        this.depth += 1

        if (this.log_debug) {
            let grammar = "[list] = key '[' csv? ']'"
            console.log(DELIMITER.repeat(this.get_depth()) + "Try to parse " + grammar)
        }

        let key = this.parse_key()
        if (!key) {
            return key
        }

        if (this.check(tokens.ListStartToken)) {
            this.advance()
        }
        else {
            this.depth -= 1
            this.backtrack(mark)
            return false
        }

        let csv = this.parse_csv()
        if (!csv) {
            csv = []
        }

        if (this.check(tokens.ListEndToken)) {
            this.advance()
            let list = []
            list[key] = csv
            if (this.log_debug) {
                console.log(DELIMITER.repeat(this.get_depth()) + "Successfully parsed a list.")
            }
            else {
                return list
            }
        }
        else {
            this.depth -= 1
            this.backtrack(mark)
            return false
        }
    }

    parse_csv() {
        /* Returns a list that represents comma-separated LookML values.
        Returns:
            A list with the parsed values or None if the grammar doesn't match
        Grammar:
            csv ← (literal / quoted_literal) ("," (literal / quoted_literal))* ","?
        Examples:
            Input (before tokenizing into a stream):
            ------
            1) "[date, week]"
            2) "['foo', 'bar']"
            Output (list):
            -------
            1) ["date", "week"]
            2) ["foo", "bar"] */

        let mark = this.index
        this.depth += 1
    
        if (this.log_debug) {
            let grammar = '[csv] = (literal / quoted_literal) ("," (literal / quoted_literal))* ","?'
            console.log(DELIMITER.repeat(this.get_depth()) + "Try to parse " + grammar)
        }
        let values = []

        if (this.check(tokens.LiteralToken, tokens.QuotedLiteralToken)) {
            values.push(this.consume_token_value())
        }
        else {
            this.depth -= 1
            this.backtrack(mark)
            return false
        }

        while (!this.check(tokens.ListEndToken)) {
            let key = ""
            if (this.check(tokens.CommaToken)) {
                this.advance()
            }
            else if (this.check(tokens.ValueToken)) {
                key = values.pop()
                this.advance()
            }
            else {
                this.depth -= 1
                this.backtrack(mark)
                return false
            }

            if (this.check(tokens.LiteralToken, tokens.QuotedLiteralToken)) {
                if (key.length) {
                    values[key] = this.consume_token_value()
                }
                else {
                    values.push(this.consume_token_value())
                }
            }
            else if (this.check(tokens.ListEndToken)) {
                break
            }
            else {
                this.depth -= 1
                this.backtrack(mark)
                return false
            }
        }

        if (this.log_debug) {
            console.log(DELIMITER.repeat(this.get_depth()) + "Successfully parsed comma-separated values.")
        }
        return values
    }
}