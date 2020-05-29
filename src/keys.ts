// Defines constant sequences of LookML keys.
import * as tokens from './tokens'

/* These are repeatable keys in LookML that the parser should collapse into a single
Javascript object key. For example, LookML can have multiple dimensions, so the parser
will combine those dimensions into a list of dictionaries with a top-level key,
`dimensions`. */

export const PLURAL_KEYS: string[] = [
    "view",
    "measure",
    "dimension",
    "dimension_group",
    "access_filter",
    "bind_filter",
    "map_layer",
    "parameter",
    "set",
    "column",
    "derived_column",
    "include",
    "explore",
    "link",
    "when",
    "allowed_value",
    "named_value_format",
    "join",
    "datagroup",
    "access_grant",
    "sql_step",
    "action",
    "param",
    "form_param",
    "option",
    "user_attribute_param",
    "assert",
    "test",
]

// These are keys in LookML that should be recognized as expression blocks (end with ;;).

export const EXPR_BLOCK_KEYS: string[] = [
    "expression_custom_filter",
    "expression",
    "html",
    "sql_trigger_value",
    "sql_table_name",
    "sql_distinct_key",
    "sql_start",
    "sql_always_having",
    "sql_always_where",
    "sql_trigger",
    "sql_foreign_key",
    "sql_where",
    "sql_end",
    "sql_create",
    "sql_latitude",
    "sql_longitude",
    "sql_step",
    "sql_on",
    "sql",
]

/* These are keys that the serializer should quote the value of (e.g. `label: "Label"`).
An example of an unquoted literal would be `hidden: no`. */

export const QUOTED_LITERAL_KEYS: string[] = [
    "label",
    "view_label",
    "group_label",
    "group_item_label",
    "suggest_persist_for",
    "default_value",
    "direction",
    "value_format",
    "name",
    "url",
    "icon_url",
    "form_url",
    "default",
    "tags",
    "value",
    "description",
    "sortkeys",
    "indexes",
    "partition_keys",
    "connection",
    "include",
    "max_cache_age",
    "allowed_values",
    "timezone",
    "persist_for",
    "cluster_keys",
    "distribution",
    "extents_json_url",
    "feature_key",
    "file",
    "property_key",
    "property_label_key",
    "else",
]

/* These are keys for fields in Looker that have a "name" attribute. Since lkml uses the
key `name` to represent the name of the field (e.g. for `dimension: dimension_name {`,
the `name` key would hold the value `dimension_name`.) */

export const KEYS_WITH_NAME_FIELDS: string[] = [
    "user_attribute_param",
    "param",
    "form_param",
    "option",
]

export const CHARACTER_TO_TOKEN = {
    "\0": tokens.StreamEndToken,
    "{": tokens.BlockStartToken,
    "}": tokens.BlockEndToken,
    "[": tokens.ListStartToken,
    "]": tokens.ListEndToken,
    ",": tokens.CommaToken,
    ":": tokens.ValueToken,
    ";": tokens.ExpressionBlockEndToken,
}

/* These are keys for fields that have values within square brackets [] */
export const KEYS_FOR_SETS: string[] = [
    "filters",
    "sorts",
    "required_access_grants",
    "timeframes",
    "intervals",
    "extends",
    "cluster_keys",
    "sortkeys",
    "indexes",
    "partition_keys",
    "fields",
    "alias",
    "required_fields",
    "drill_fields",
    "tags",
    "tiers",
    "suggestions",
]