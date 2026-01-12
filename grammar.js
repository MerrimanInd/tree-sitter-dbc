/**
 * @file CANbus DBC bus decriptor file format
 * @author Xander Cesari <xander@merriman.industries>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check



export default grammar({
  name: 'dbc',

  extras: $ => [
    /\s+/,
    /\(\*[\s\S]*?\*\)/ // Comments in the spec format [cite: 66]
  ],

  rules: {
    // Top-level structure [cite: 76-99]
    dbc_file: $ => seq(
      $.version,
      $.new_symbols,
      $.bit_timing,
      $.nodes,
      repeat($.value_table),
      repeat($.message),
      repeat($.message_transmitter),
      repeat($.environment_variable),
      repeat($.environment_variable_data),
      repeat($.signal_type),
      repeat($.comment),
      repeat($.attribute_definition),
      repeat($.attribute_default),
      repeat($.attribute_values),
      repeat($.value_description),
      repeat($.signal_group),
      repeat($.signal_extended_value_type),
      repeat($.extended_multiplexing)
    ),

    // 4 Version and New Symbols [cite: 130-137]
    version: $ => seq('VERSION', $.char_string),
    
    new_symbols: $ => seq(
      'NS_ :',
      repeat($._ns_symbol)
    ),

    _ns_symbol: $ => choice(
      'NS_DESC_', 'CM_', 'BA_DEF_', 'BA_', 'VAL_', 'CAT_DEF_', 'CAT_', 'FILTER',
      'BA_DEF_DEF_', 'EV_DATA_', 'ENVVAR_DATA_', 'SGTYPE_', 'SGTYPE_VAL_',
      'BA_DEF_SGTYPE_', 'BA_SGTYPE_', 'SIG_TYPE_REF_', 'VAL_TABLE_', 'SIG_GROUP_',
      'SIG_VALTYPE_', 'SIGTYPE_VALTYPE_', 'BO_TX_BU_', 'BA_DEF_REL_', 'BA_REL_',
      'BA_DEF_DEF_REL_', 'BU_SG_REL_', 'BU_EV_REL_', 'BU_BO_REL_', 'SG_MUL_VAL_'
    ),

    // 5 Bit Timing [cite: 141]
    bit_timing: $ => seq('BS_:', optional(seq($.unsigned_integer, ':', $.unsigned_integer, ',', $.unsigned_integer))),

    // 6 Node Definitions [cite: 149]
    nodes: $ => seq('BU_:', repeat($.node_name)),
    node_name: $ => $.dbc_identifier,

    // 7 Value Tables [cite: 154]
    value_table: $ => seq(
      'VAL_TABLE_', 
      $.dbc_identifier, 
      repeat($.value_description_pair), 
      ';'
    ),

    // 8 Message and Signal Definitions [cite: 172, 191]
    message: $ => seq(
      'BO_', 
      $.message_id, 
      $.message_name, 
      ':', 
      $.message_size, 
      $.transmitter, 
      repeat($.signal)
    ),

    message_id: $ => $.unsigned_integer,
    message_name: $ => $.dbc_identifier,
    message_size: $ => $.unsigned_integer,
    transmitter: $ => choice($.node_name, 'Vector__XXX'),

    signal: $ => seq(
      'SG_', 
      $.signal_name, 
      optional($.multiplexer_indicator), 
      ':', 
      $.start_bit, 
      '|', 
      $.signal_size, 
      '@', 
      $.byte_order, 
      $.value_type, 
      '(', $.factor, ',', $.offset, ')',
      '[', $.minimum, '|', $.maximum, ']',
      $.char_string, // unit
      $.receiver, 
      repeat(seq(',', $.receiver))
    ),

    signal_name: $ => $.dbc_identifier,
    multiplexer_indicator: $ => choice('M', /m\d+/), // [cite: 194-197]
    start_bit: $ => $.unsigned_integer,
    signal_size: $ => $.unsigned_integer,
    byte_order: $ => /[01]/, // 0=big, 1=little [cite: 214]
    value_type: $ => /[+-]/, // +=unsigned, -=signed [cite: 216-219]
    factor: $ => $.double,
    offset: $ => $.double,
    minimum: $ => $.double,
    maximum: $ => $.double,
    receiver: $ => choice($.node_name, 'Vector__XXX'),

    // 9 Environment Variables [cite: 265]
    environment_variable: $ => seq(
      'EV_', $.env_var_name, ':', $.env_var_type,
      '[', $.minimum, '|', $.maximum, ']',
      $.char_string, $.initial_value, $.ev_id, $.access_type, $.access_node,
      repeat(seq(',', $.access_node)), ';'
    ),

    env_var_name: $ => $.dbc_identifier,
    env_var_type: $ => /[012]/, // 0-int, 1-float, 2-string [cite: 268]
    initial_value: $ => $.double,
    ev_id: $ => $.unsigned_integer,
    access_type: $ => /DUMMY_NODE_VECTOR\d+/,
    access_node: $ => choice($.node_name, 'VECTOR__XXX'),

    // 11 Comments [cite: 301]
    comment: $ => seq(
      'CM_', 
      choice(
        $.char_string,
        seq('BU_', $.node_name, $.char_string),
        seq('BO_', $.message_id, $.char_string),
        seq('SG_', $.message_id, $.signal_name, $.char_string),
        seq('EV_', $.env_var_name, $.char_string)
      ),
      ';'
    ),

    // 12 Attributes [cite: 306-312]
    // _keyword_ba_def: $ => prec(1, 'BA_DEF_'),
    // _keyword_ba_def_def: $ => prec(2, 'BA_DEF_DEF_'),

    // // Use token and prec here to force the lexer to choose
    // _BA_DEF_DEF_KW: $ => token(prec.right(2, 'BA_DEF_DEF_')),
    // _BA_DEF_KW:     $ => token(prec.right(1, 'BA_DEF_')),

    attribute_definition: $ => seq(
      'BA_DEF_',
      // $._BA_DEF_KW,
      optional(choice('BU_', 'BO_', 'SG_', 'EV_')), 
      $.char_string, 
      $.attribute_value_type, 
      ';'
    ),

    attribute_default: $ => prec(2, seq(
      'BA_DEF_DEF_',
      // $._BA_DEF_DEF_KW,
      $.char_string,
      $.attribute_value,
      ';'
    )),

    attribute_value: $ => seq(
      choice(
        $._attr_val,
        seq('BU_', $.node_name, $._attr_val),
        seq('BO_', $.message_id, $._attr_val),
        seq('SG_', $.message_id, $.signal_name, $._attr_val),
        seq('EV_', $.env_var_name, $._attr_val)
      ),
    ),

    attribute_values: $ => seq(
      'BA_', 
      $.char_string, 
      choice(
        $._attr_val,
        seq('BU_', $.node_name, $._attr_val),
        seq('BO_', $.message_id, $._attr_val),
        seq('SG_', $.message_id, $.signal_name, $._attr_val),
        seq('EV_', $.env_var_name, $._attr_val)
      ),
      ';'
    ),

    _attr_val: $ => choice($.unsigned_integer, $.signed_integer, $.double, $.char_string),

    attribute_value_type: $ => choice(
      seq('INT', $.signed_integer, $.signed_integer),
      seq('HEX', $.signed_integer, $.signed_integer),
      seq('FLOAT', $.double, $.double),
      'STRING',
      seq('ENUM', optional(seq($.char_string, repeat(seq(',', $.char_string)))))
    ),

    // Shared Lexical Elements [cite: 32-40, 50]
    dbc_identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]{0,31}/,
    unsigned_integer: $ => /\d+/,
    signed_integer: $ => /-?\d+/,
    double: $ => /-?\d+(\.\d+)?([eE][+-]?\d+)?/,
    char_string: $ => /"([^"\\\r\n]*)"/, // 
    
    value_description_pair: $ => seq($.unsigned_integer, $.char_string),
    
    // Additional constructs
    message_transmitter: $ => seq('BO_TX_BU_', $.message_id, ':', repeat($.transmitter), ';'), // [cite: 255]
    signal_type: $ => seq('SGTYPE_', $.dbc_identifier, ':', $.signal_size, '@', $.byte_order, $.value_type, /* ... simplified for brevity */ ';'),
    value_description: $ => seq('VAL_', choice(seq($.message_id, $.signal_name), $.env_var_name), repeat($.value_description_pair), ';'), // [cite: 260, 289]
    signal_group: $ => seq('SIG_GROUP_', $.message_id, $.dbc_identifier, $.unsigned_integer, ':', repeat($.signal_name), ';'), // [cite: 297]
    signal_extended_value_type: $ => seq('SIG_VALTYPE_', $.message_id, $.signal_name, /[0123]/, ';'), // [cite: 248]
    extended_multiplexing: $ => seq('SG_MUL_VAL_', $.message_id, $.signal_name, $.signal_name, $.value_ranges, ';'), // [cite: 316]
    value_ranges: $ => seq($.value_range, repeat(seq(',', $.value_range))),
    value_range: $ => seq($.unsigned_integer, '-', $.unsigned_integer),
    environment_variable_data: $ => seq('ENVVAR_DATA_', $.env_var_name, ':', $.unsigned_integer, ';') // [cite: 287]
  }
});
