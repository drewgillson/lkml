// Serializes a Javascript object into a LookML string.

import { EXPR_BLOCK_KEYS
       , KEYS_WITH_NAME_FIELDS
       , PLURAL_KEYS
       , QUOTED_LITERAL_KEYS } from "./keys"

export class Serializer {
    /* Serializes a Javascript object into a LookML string.
    Review the grammar specified for the Parser class to understand how LookML
    is represented. The grammar details the differences between blocks, pairs, keys,
    and values.
    Attributes:
        parent_key: The name of the key at the previous level in a LookML block
        level: The number of indentations appropriate for the current position
        field_counter: The position of the current field when serializing
            iterable objects
        base_indent: Whitespace representing one tab
        indent: An indent of whitespace dynamically sized for the current position
        newline_indent: A newline plus an indent string */
    
    parent_key: string
    level: number
    field_counter: number
    base_indent: string
    indent: string
    newline_indent: string

    constructor() {
        // Initializes the Serializer.
        this.parent_key = ""
        this.level = 0
        this.field_counter = 0
        this.base_indent = " ".repeat(2)
        this.indent = ""
        this.newline_indent = "\n"
    }

    increase_level() {
        // Increases the indent level of the current line by one tab.
        this.field_counter = 0
        this.level += 1
        this.update_indent()
    }

    decrease_level() {
        // Decreases the indent level of the current line by one tab.
        this.field_counter = 0
        this.level -= 1
        this.update_indent()
    }

    update_indent() {
        // Sets the indent string based on the current level.
        this.indent = this.base_indent.repeat(this.level)
        this.newline_indent = "\n" + this.indent
    }

    is_plural_key(key: string) {
        /* Returns True if the key is a repeatable key.
        For example, `dimension` can be repeated, but `sql` cannot be.
        The key `allowed_value` is a special case and changes behavior depending on its
        parent key. If its parent key is `access_grant`, it is a list and cannot be
        repeated. Otherwise, it can be repeated. */

        if (key.substr(-1) == "s") {
            let singular_key = key.replace(/s$/, '');
            return (PLURAL_KEYS.indexOf(singular_key) != -1 && !(
                singular_key == "allowed_value"
                && this.parent_key.replace(/s$/, '') == "access_grant"
            ))
        }
        else {
            return false
        }
    }

    *chain_with_newline(obj: Object) {
        for (let [key, value] of Object.entries(Object.assign({},obj))) {
            let any = this.write_any(key, value)
            let output = ""
            while (true) {
                let iter = any.next()
                if (!iter.done) {
                    output += iter.value
                }
                else {
                    break
                }
            }
            yield output
            yield "\n"
        }
    }

    serialize(obj: Object) {
        // Returns a LookML string serialized from an object.
    
        return "" + this.chain_with_newline(obj).next().value
    }

    *expand_list(key: string, values: any) {
        /* Expands and serializes a list of values for a repeatable key.
        This method is exclusively used for sequences of values with a repeated key like
        `dimensions` or `views`, which need to be serialized sequentially with a newline
        in between.
        Args:
            key: A repeatable LookML field type (e.g. "views" or "dimension_groups")
            values: A sequence of objects to be serialized
        Returns:
            A generator of serialized string chunks */

        if (key != "filters" && key != "bind_filters") {
            key = key.replace(/s$/, '')
        }
        let i = 0
        for (let [idx, val] of values.entries()) {
            if (i > 0) {
                yield "\n"
            }
            yield* this.write_any(key, val)
            i++
        }
    }

    *write_any(key: string, value: any) {
        /* Dynamically serializes a Javascript object based on its type.
        Args:
            key: A LookML field type (e.g. "suggestions" or "hidden")
            value: A string, tuple, or list to serialize
        Raises:
            TypeError: If input value is not of a valid type
        Returns:
            A generator of serialized string chunks */

        let value_type = typeof(value)
        let key_type = typeof(key)

        if (value_type == 'string') {
            yield* this.write_pair(key, value)
        }
        else if (value_type == 'object' && key_type == 'string' && ['view','dimension','measure'].indexOf(key) == -1) {
            if (this.is_plural_key(key)) {
                yield* this.expand_list(key, value)
            }
            else {
                yield* this.write_set(key, value)
            }
        }
        else if (value_type == 'object') {
            let name = ""
            if (KEYS_WITH_NAME_FIELDS.indexOf(key) != -1 || Object.keys(value).indexOf("name") == -1) {
                name = ""
            }
            else {
                name = value.name
                delete(value.name)
            }
            if (!isNaN(Number(key))) {
                key = value.name
            }
            
            let block = this.write_block(key, value, name)
            let output = ""
            while (true) {
                let iter = block.next()
                if (!iter.done) {
                    output += iter.value
                }
                else {
                    break
                }
            }
            yield output
        }
        else {
            throw new TypeError("Value must be a string, list, array, or object.")
        }

        this.field_counter += 1
    }

    *write_block(key: any, fields: Object, name: string) {
        /* Serializes an object to a LookML block.
        Args:
            key: A LookML field type (e.g. "dimension")
            fields: An object to serialize (e.g. {"sql": "${TABLE}.order_id"})
            name: An optional name of the block (e.g. "order_id")
        Returns:
            A generator of serialized string chunks */

        if (this.field_counter > 0) {
            yield "\n"
        }
        yield* this.write_key(key)

        if (name) {
            yield name + "{"
        }
        else {
            yield "{"
        }

        if (fields) {
            this.parent_key = key
            this.increase_level()
            yield "\n"
            let i = 0
            for (let [idx, val] of Object.entries(fields)) {
                if (i > 0) {
                    yield "\n"
                }
                yield* this.write_any(idx, val)
                i++
            }
            this.decrease_level()
            yield this.newline_indent
        }

        yield "}"
    }

    *write_set(key: string, values: any) {
        /* Serializes a sequence to a LookML block.
        Args:
            key: A LookML field type (e.g. "fields")
            value: A sequence to serialize (e.g. ["orders.order_id", "orders.item"])
        Returns:
            A generator of serialized string chunks

        `suggestions` is only quoted when it's a set, so override the default */

        let force_quote = false
        if (key == "suggestions") {
            force_quote = true
        }

        yield* this.write_key(key)
        yield "["

        if (values) {
            let i = 0
            if (values.length > 5) {
                this.increase_level()
                yield this.newline_indent
                for (let [idx, val] of Object.entries(values)) {
                    if (i > 0) {
                        yield "," + this.newline_indent
                    }
                    yield* this.write_value(idx, val, force_quote)
                    i++
                }
                this.decrease_level()
                yield this.newline_indent
            }
            else {
                for (let [idx, val] of Object.entries(values)) {
                    if (i > 0) {
                        yield ", "
                    }
                    yield* this.write_value(idx, val, force_quote)
                    i++
                }
            }
        }
        yield "]"
    }

    *write_pair(key: string, value: string) {
        /* Serializes a key and value to a LookML pair.
        Args:
            key: A LookML field type (e.g. "hidden")
            value: The value string (e.g. "yes")
        Returns:
            A generator of serialized string chunks */

        yield* this.write_key(key)
        yield* this.write_value(key, value)
    }

    *write_key(key: string) {
        /* Serializes a key to LookML.
        Args:
            key: A LookML field type (e.g. "sql")
        Returns:
            A generator of serialized string chunks */
        yield this.indent + key + ":"
    }

    *write_value(key: string, value: any, force_quote: boolean = false) {
        /* Serializes a value to LookML, quoting it required by the key or forced.
        Args:
            key: A LookML field type (e.g. "hidden")
            value: The value string (e.g. "yes")
            force_quote: True if value should always be quoted
        Returns:
            A generator of serialized string chunks */

        if (force_quote || QUOTED_LITERAL_KEYS.indexOf(key) != -1) {
            yield '"'
            yield value
            yield '"'
        }
        else if (EXPR_BLOCK_KEYS.indexOf(key) != -1) {
            yield value
            yield " ;;"
        }
        else {
            yield value
        }
    }
}