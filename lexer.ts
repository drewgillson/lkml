// Splits a LookML string into a sequence of tokens.

import * as tokens from "./tokens"
import { CHARACTER_TO_TOKEN, EXPR_BLOCK_KEYS } from "./keys"

export class Lexer {
    /*Splits a LookML string into a sequence of tokens.
    Attributes:
        text: Raw LookML to parse, padded with null character to denote end of stream
        index: Position of lexer in characters as it traverses the text
        tokens: Sequence of tokens that contain the relevant chunks of text
        line_number: Position of lexer in lines as it traverses the text
    */
    text: string
    index: number
    tokens: Array<object>
    line_number: number

    constructor(text: string) {
        /* Initializes the Lexer with a LookML string and sets the index.
        Args:
            text: LookML string to be lexed */

        this.text = text + "\0"
        this.index = 0
        this.tokens = []
        this.line_number = 1
    }

    peek(): string {
        // Returns the character at the current index of the text being lexed.

        return this.text.charAt(this.index)
    }

    peek_multiple(length: number): string {
        /* Returns the next n characters from the current index in the text being lexed.
        Args:
            length: The number of characters to return */

        return this.text.substring(this.index, this.index + length)
    }

    advance(length: number = 1): void {
        /* Moves the index forward by n characters.
        Args:
            length: The number of positions forward to move the index. */
        this.index += length
    }

    consume(): string {
        // Returns the current index character and advances the index 1 character.
        this.advance()
        return this.text.charAt(this.index - 1)
    }

    scan_until_token(): void {
        // Skips through the text being lexed to the next tokenizable character.
        
        let found = false
        while (!found) {
            while (this.peek() == "\n" ||
                   this.peek() == "\t" ||
                   this.peek() == " ") {

                if (this.peek() == "\n") {
                    this.line_number += 1
                }
                this.advance()
            }
            if (this.peek() == "#") {
                while (this.peek() != "\0" && this.peek() != "\n") {
                    this.advance()
                }
            }
            else {
                found = true
            }
        }
    }

    scan() {
        /* Tokenizes LookML into a sequence of tokens.
        This method skips through the text being lexed until it finds a character that
        indicates the start of a new token. It consumes the relevant characters and adds
        the tokens to a sequence until it reaches the end of the text. */
        
        this.tokens.push(new tokens.StreamStartToken(this.line_number));

        while (true) {
            this.scan_until_token()
            let ch = this.peek()

            if (ch == "\0") {
                this.tokens.push(new CHARACTER_TO_TOKEN[ch](this.line_number))
                break;
            }
            else if (ch == ";") {
                if (this.peek_multiple(2) == ";;") {
                    this.advance(2)
                    this.tokens.push(new CHARACTER_TO_TOKEN[ch](this.line_number))
                }
            }
            else if (ch == '"') {
                this.advance()
                this.tokens.push(this.scan_quoted_literal())
            }
            else if (Object.keys(CHARACTER_TO_TOKEN).indexOf(ch) != -1) {
                this.advance()
                this.tokens.push(new CHARACTER_TO_TOKEN[ch](this.line_number))
            }
            else if (this.check_for_expression_block(this.peek_multiple(25))) {
                this.tokens.push(this.scan_literal())
                this.scan_until_token()
                this.advance()
                this.tokens.push(new tokens.ValueToken(this.line_number))
                this.scan_until_token()
                this.tokens.push(this.scan_expression_block())
            }
            else {
                this.tokens.push(this.scan_literal())
            }
        }

        return this.tokens
    }

    check_for_expression_block(str: string): boolean {
        // Returns True if the input string is an expression block.

        for (const entry of EXPR_BLOCK_KEYS) {
            if (str.lastIndexOf(entry + ":", 0) === 0) {
                return true
            }
        }
    }

    scan_expression_block(): object {
        /* Returns an token from an expression block string.
        This method strips any trailing whitespace from the expression string, since
        Looker usually adds an extra space before the `;;` terminal. */

        let chars = ""
        while (this.peek_multiple(2) != ";;") {
            if (this.peek() == "\n") {
                this.line_number += 1
            }
            chars += this.consume()
        }
        chars = chars.trim() // TODO: this was an rtrim... could it cause a bug?
        return new tokens.ExpressionBlockToken(chars, this.line_number)
    }

    scan_literal(): object {
        // Returns a token from a literal string.

        let chars = ""
        while (this.peek() != "\0" &&
               this.peek() != " " &&
               this.peek() != "\n" &&
               this.peek() != "\t" &&
               this.peek() != ":" &&
               this.peek() != "}" &&
               this.peek() != "{" &&
               this.peek() != "," &&
               this.peek() != "]") {

            chars += this.consume()
        }
        return new tokens.LiteralToken(chars, this.line_number)
    }

    scan_quoted_literal(): object {
        /* Returns a token from a quoted literal string.
        The initial double quote character is consumed in the scan method, so this
        method only scans for the trailing quote to indicate the end of the token. */

        let chars = ""
        while (true) {
            let ch = this.peek()
            if (ch == '"') {
                break;
            }
            else if (ch == "\\") {
                chars += this.consume()  // Extra consume to skip the escaped character
            }
            else if (ch == "\n") {
                this.line_number += 1
            }
            chars += this.consume()
        }
        this.advance()
        return new tokens.QuotedLiteralToken(chars, this.line_number)
    }
}