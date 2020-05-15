// Tokens used by the lexer to tokenize LookML.

export const tokenTypes = [];

export function register_token() {
    return function(target: Function) {
        tokenTypes.push(target);
    };
}

@register_token()
export class Token {
    // Base class for LookML tokens, lexed from LookML strings.

    id: string = "<base token>"
    name: string = "Token"
    value: string
    line_number: number

    constructor(line_number: number) {
        /* Initializes a Token.
        Args:
            line_number: The corresponding line in the text where this token begins */
        
        this.line_number = line_number
    }

    __eq__(self, other): boolean {
        // Compare one Token to another by their type.

        return self.constructor.name == other.constructor.name
    }

    __repr__(self): string {
        /* Returns the token's string representation, truncated to 25 characters.
        If the token has a `value` attribute, include that in the output. */
        
        let value = self.value.strip()
        if (value.length > 25) {
            value = value.substring(0,25) + " ... "
        }
        return self.class.name + "(" + value + ")"
    }
}

@register_token()
export class ContentToken {
    // Base class for LookML tokens that contain a string of content.
    
    token: Token
    value: string
    line_number: number

    __eq__(self, other): boolean {
        // Compare one ContentToken to another by their values.

        return(self.id == other.id && self.value == other.value)
    }
}

@register_token()
export class StreamStartToken {
    // Represents the start of a stream of characters.

    id: string = "<stream start>"
    name: string = "StreamStartToken"
    line_number: number

    constructor(line_number: number) {
        this.line_number = line_number
    }
}

@register_token()
export class StreamEndToken {
    // Represents the end of a stream of characters.

    id: string = "<stream end>"
    name: string = "StreamEndToken"
    line_number: number

    constructor(line_number: number) {
        this.line_number = line_number
    }
}

@register_token()
export class BlockStartToken {
    // Represents the start of a block.

    id: string = "{"
    name: string = "BlockStartToken"
    line_number: number

    constructor(line_number: number) {
        this.line_number = line_number
    }
}

@register_token()
export class BlockEndToken {
    // Represents the end of a block.

    id: string = "}"
    name: string = "BlockEndToken"
    line_number: number

    constructor(line_number: number) {
        this.line_number = line_number
    }
}

@register_token()
export class ValueToken {
    // Separates a key from a value.

    id: string = ":"
    name: string = "ValueToken"
    line_number: number

    constructor(line_number: number) {
        this.line_number = line_number
    }
}

@register_token()
export class ExpressionBlockEndToken {
    // Represents the end of an expression block.

    id: string = ";;"
    name: string = "ExpressionBlockEndToken"
    line_number: number

    constructor(line_number: number) {
        this.line_number = line_number
    }
}

@register_token()
export class CommaToken {
    // Separates elements in a list.

    id: string = ","
    name: string = "CommaToken"
    line_number: number

    constructor(line_number: number) {
        this.line_number = line_number
    }
}

@register_token()
export class ListStartToken {
    // Represents the start of a list.

    id: string = "["
    name: string = "ListStartToken"
    line_number: number

    constructor(line_number: number) {
        this.line_number = line_number
    }
}

@register_token()
export class ListEndToken {
    // Represents the end of a list.

    id: string = "]"
    name: string = "ListEndToken"
    line_number: number

    constructor(line_number: number) {
        this.line_number = line_number
    }
}

@register_token()
export class ExpressionBlockToken {
    // Contains the value of an expression block.

    id: string = "<expression block>"
    name: string = "ExpressionBlockToken"
    chars: string
    line_number: number

    constructor(chars: string, line_number: number) {
        this.chars = chars
        this.line_number = line_number
    }
}

@register_token()
export class LiteralToken {
    // Contains the value of an unquoted literal.

    id: string = "<literal>"
    name: string = "LiteralToken"
    chars: string
    line_number: number

    constructor(chars: string, line_number: number) {
        this.chars = chars
        this.line_number = line_number
    }
}

@register_token()
export class QuotedLiteralToken {
    // Contains the value of a quoted literal.

    id: string = "<quoted literal>"
    name: string = "QuotedLiteralToken"
    chars: string
    line_number: number

    constructor(chars: string, line_number: number) {
        this.chars = chars
        this.line_number = line_number
    }
}