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
    /\s/,
    $.comment
  ],

  rules: {
    source_file: $ => repeat(choice(
      $.version,
      $.new_symbols,
      $.bit_timing,
      $.node,
      $.value_table,
      $.message,
      $.message_transmitter,
      $.environment_variable,
      $.environment_variable_data,
      $.signal_type,
      $.comment_definition,
      $.attribute_definition,
      $.attribute_default,
      $.attribute_value,
      $.value_description,
      $.signal_group,
      $.comment
    )),

    // VERSION "1.0"
    version: $ => seq('VERSION', $.string),

    // NS_ : 
    //   NS_DESC_
    //   CM_
    //   ...
    new_symbols: $ => seq(
      'NS_',
      ':',
      repeat($.symbol)
    ),

    symbol: $ => /[A-Z_][A-Z0-9_]*/,

    // BS_: 500000 : 0,0
    bit_timing: $ => seq(
      'BS_',
      ':',
      optional(seq(
        $.number,
        ':',
        $.number,
        ',',
        $.number
      ))
    ),

    // BU_: Node1 Node2 Node3
    node: $ => seq(
      'BU_',
      ':',
      repeat($.identifier)
    ),

    // VAL_TABLE_ TableName 0 "Value0" 1 "Value1" ;
    value_table: $ => seq(
      'VAL_TABLE_',
      $.identifier,
      repeat(seq($.number, $.string)),
      ';'
    ),

    // BO_ 2364540158 MessageName: 8 TransmittingNode
    message: $ => seq(
      'BO_',
      $.number,
      $.identifier,
      ':',
      $.number,
      $.identifier,
      repeat($.signal)
    ),

    // SG_ SignalName : 0|8@1+ (1,0) [0|0] "unit" Node1,Node2
    signal: $ => seq(
      'SG_',
      field('name', $.identifier),
      optional($.multiplexer_indicator),
      ':',
      field('start_bit', $.number),
      '|',
      field('length', $.number),
      '@',
      field('byte_order', choice('0', '1')),
      field('value_type', choice('+', '-')),
      '(',
      field('factor', $.number),
      ',',
      field('offset', $.number),
      ')',
      '[',
      field('min', $.number),
      '|',
      field('max', $.number),
      ']',
      field('unit', $.string),
      field('receivers', $.receiver_list)
    ),

    multiplexer_indicator: $ => choice(
      'M',
      seq('m', $.number)
    ),

    receiver_list: $ => seq(
      $.identifier,
      repeat(seq(',', $.identifier))
    ),

    // BO_TX_BU_ 2364540158 : Node1,Node2,Node3;
    message_transmitter: $ => seq(
      'BO_TX_BU_',
      $.number,
      ':',
      $.receiver_list,
      ';'
    ),

    // EV_ EnvVarName: 0 [0|100] "unit" 0 2 DUMMY_NODE_VECTOR0 Vector__XXX;
    environment_variable: $ => seq(
      'EV_',
      $.identifier,
      ':',
      $.number,
      '[',
      $.number,
      '|',
      $.number,
      ']',
      $.string,
      $.number,
      $.number,
      $.identifier,
      $.identifier,
      ';'
    ),

    // ENVVAR_DATA_ EnvVarName: 4;
    environment_variable_data: $ => seq(
      'ENVVAR_DATA_',
      $.identifier,
      ':',
      $.number,
      ';'
    ),

    // SIG_VALTYPE_ 2364540158 SignalName : 1;
    signal_type: $ => seq(
      'SIG_VALTYPE_',
      $.number,
      $.identifier,
      ':',
      $.number,
      ';'
    ),

    // CM_ "Database comment";
    // CM_ BU_ NodeName "Node comment";
    // CM_ BO_ 2364540158 "Message comment";
    // CM_ SG_ 2364540158 SignalName "Signal comment";
    comment_definition: $ => seq(
      'CM_',
      optional(choice(
        seq('BU_', $.identifier),
        seq('BO_', $.number),
        seq('SG_', $.number, $.identifier),
        seq('EV_', $.identifier)
      )),
      $.string,
      ';'
    ),

    // BA_DEF_ "AttributeName" INT 0 100;
    // BA_DEF_ BO_ "AttributeName" STRING;
    attribute_definition: $ => seq(
      choice('BA_DEF_', 'BA_DEF_DEF_'),
      optional(choice('BU_', 'BO_', 'SG_', 'EV_')),
      $.string,
      choice(
        seq('INT', optional(seq($.number, $.number))),
        seq('HEX', optional(seq($.number, $.number))),
        seq('FLOAT', optional(seq($.number, $.number))),
        'STRING',
        seq('ENUM', repeat1($.string))
      ),
      ';'
    ),

    // BA_DEF_DEF_ "AttributeName" 0;
    attribute_default: $ => seq(
      'BA_DEF_DEF_',
      $.string,
      choice($.number, $.string),
      ';'
    ),

    // BA_ "AttributeName" 123;
    // BA_ "AttributeName" BU_ NodeName 456;
    // BA_ "AttributeName" BO_ 2364540158 789;
    // BA_ "AttributeName" SG_ 2364540158 SignalName 0;
    attribute_value: $ => seq(
      'BA_',
      $.string,
      optional(choice(
        seq('BU_', $.identifier),
        seq('BO_', $.number),
        seq('SG_', $.number, $.identifier),
        seq('EV_', $.identifier)
      )),
      choice($.number, $.string),
      ';'
    ),

    // VAL_ 2364540158 SignalName 0 "Off" 1 "On" ;
    value_description: $ => seq(
      'VAL_',
      $.number,
      $.identifier,
      repeat(seq($.number, $.string)),
      ';'
    ),

    // SIG_GROUP_ 2364540158 GroupName 1 : SignalName1 SignalName2;
    signal_group: $ => seq(
      'SIG_GROUP_',
      $.number,
      $.identifier,
      $.number,
      ':',
      repeat1($.identifier),
      ';'
    ),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number: $ => choice(
      /[+-]?[0-9]+/,
      /[+-]?[0-9]+\.[0-9]+([eE][+-]?[0-9]+)?/,
      /0[xX][0-9a-fA-F]+/
    ),

    string: $ => /"([^"\\]|\\.)*"/,

    comment: $ => token(seq('//', /.*/))
  }
});
