/**
 * @file CANbus DBC bus descriptor file format
 * @author Xander Cesari <xander@merriman.industries>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Comment blocks marked 'Specification:' are the exact syntax from the DBC specification (with minor typos corrected), provided here as a reference for how the parser was written.
// Overall this grammar is structured in the same general order as the specification with section headings copied over for easy cross-referencing.

export default grammar({
  name: 'dbc',

  extras: $ => [
    /\s+/,
    /\(\*[\s\S]*?\*\)/ // Comments in the spec format [cite: 66]
  ],

  rules: {

    // Top-level structure
    /** Specification:
      DBC_file =
        version
        new_symbols
        bit_timing (*obsolete but required*)
        nodes
        value_tables
        messages
        message_transmitters
        environment_variables
        environment_variables_data
        signal_types
        comments
        attribute_definitions
        sigtype_attr_list
        attribute_defaults
        attribute_values
        value_descriptions
        category_definitions (*obsolete*)
        categories (*obsolete*)
        filter (*obsolete*)
        signal_type_refs
        signal_groups
        signal_extended_value_type_list
        extended_multiplexing ;
    **/
    dbc_file: $ => seq(
      $.version,
      $.new_symbols,
      $.bit_timing,
      $.nodes,
      optional($.value_tables),
      optional($.messages),
      optional($.message_transmitters),
      optional($.environment_variables),
      optional($.environment_variables_data),
      optional($.signal_types),
      optional($.comments),
      optional($.attribute_definitions),
      optional($.attribute_defaults),
      optional($.attribute_values),
      optional($.value_descriptions),
      optional($.signal_groups),
      optional($.signal_extended_value_type_list),
      optional($.extended_multiplexing)
    ),

    // 2 General Definitions
    /** Specification:
      DBC_identifier: a C_identifier which doesn’t represent a DBC-Keyword.
    **/
    dbc_identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]{0,31}/,
    unsigned_integer: $ => /\d+/,
    signed_integer: $ => /-?\d+/,
    double: $ => /-?\d+(\.\d+)?([eE][+-]?\d+)?/,

    /** Specification:
      char_string: an arbitrary string consisting of any printable characters except double hyphens ('"') and backslashes ('\'). Control characters like Line Feed, Horizontal Tab, etc. are tolerated, but their interpretation depends on the application.
    **/
    char_string: $ => /"([^"\\\r\n]*)"/,

    
    // 4 Version and New Symbols
    /** Specification:
      version = ['VERSION' '"' { CANdb_version_string } '"' ];
    **/
    version: $ => seq('VERSION', $.char_string),

    /** Specification:
      new_symbols = [ '_NS' ':' ['CM_'] ['BA_DEF_'] ['BA_'] ['VAL_']
        ['CAT_DEF_'] ['CAT_'] ['FILTER'] ['BA_DEF_DEF_'] ['EV_DATA_']
        ['ENVVAR_DATA_'] ['SGTYPE_'] ['SGTYPE_VAL_'] ['BA_DEF_SGTYPE_']
        ['BA_SGTYPE_'] ['SIG_TYPE_REF_'] ['VAL_TABLE_'] ['SIG_GROUP_']
        ['SIG_VALTYPE_'] ['SIGTYPE_VALTYPE_'] ['BO_TX_BU_']
        ['BA_DEF_REL_'] ['BA_REL_'] ['BA_DEF_DEF_REL_'] ['BU_SG_REL_']
        ['BU_EV_REL_'] ['BU_BO_REL_'] [SG_MUL_VAL_'] ];
    **/
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


    // 5 Bit Timing
    /** Specification:
      bit_timing = 'BS_:' [baudrate ':' BTR1 ',' BTR2 ] ;
      baudrate = unsigned_integer ;
      BTR1 = unsigned_integer ;
      BTR2 = unsigned_integer ;
    **/
    bit_timing: $ => seq('BS_:', optional(seq($.baudrate, ':', $.BTR1, ',', $.BTR2))),
    baudrate: $ => $.unsigned_integer,
    BTR1: $ => $.unsigned_integer,
    BTR2: $ => $.unsigned_integer,

    
    // 6 Node Definitions
    /** Specifications
      nodes = 'BU_:' {node_name} ;
      node_name = DBC_identifier ;
    **/
    nodes: $ => seq('BU_:', repeat($.node_name)),
    node_name: $ => $.dbc_identifier,

    
    // 7 Value Tables
    /** Specification:
      value_tables = {value_table} ;
    **/
    value_tables: $ => repeat1($.value_table),
    
    /** Specification:
      value_table = 'VAL_TABLE_' value_table_name {value_description} ';' ;
    **/
    value_table: $ => seq(
      'VAL_TABLE_', 
      $.value_table_name,
      repeat($.value_description),
      ';'
    ),

    /** Specification:
      value_table_name = DBC_identifier ;
    **/
    value_table_name: $ => $.dbc_identifier,

    // 7.1 Value Descriptions (Value Encoding)
    value_description: $ => seq($.unsigned_integer, $.char_string),


    // 8 Message and Signal Definitions    
    /** Specification:
      messages = {message} ;
    **/
    messages: $ => repeat1($.message),

    /** Specification:
      message = BO_ message_id message_name ':' message_size transmitter {signal} ;
    **/
    message: $ => seq(
      'BO_', 
      $.message_id, 
      $.message_name, 
      ':', 
      $.message_size, 
      $.transmitter, 
      repeat($.signal)
    ),

    /** Specification:
      message_id = unsigned_integer ;
    **/
    message_id: $ => $.unsigned_integer,

    /** Specification:
      message_name = DBC_identifier ;
    **/
    message_name: $ => $.dbc_identifier,

    /** Specification:
      message_size = unsigned_integer ;
    **/
    message_size: $ => $.unsigned_integer,

    /** Specification:
      transmitter = node_name | 'Vector__XXX' 
    **/
    transmitter: $ => choice($.node_name, 'Vector__XXX'),

    // 8.1 Pseudo-message
    // TODO determine if this needs any parsing

    // 8.2 Signal Definitions    
    /** Specification:
      signal = 'SG_' signal_name multiplexer_indicator ':' start_bit '|'
      signal_size '@' byte_order value_type '(' factor ',' offset ')' '[' minimum '|' maximum ']' unit receiver {',' receiver} ;
    **/
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
      $.unit,
      $.receiver, 
      repeat(seq(',', $.receiver))
    ),

    /** Specification:
      signal_name = DBC_identifier ;
    **/
    signal_name: $ => $.dbc_identifier,

    /** Specification:
      multiplexer_indicator = ' ' | [m multiplexer_switch_value] [M] ;
    **/
    multiplexer_indicator: $ => choice('M', /m\d+/),

    /** Specification:
      start_bit = unsigned_integer ;
    **/
    start_bit: $ => $.unsigned_integer,

    /** Specification:
      signal_size = unsigned_integer ;
    **/
    signal_size: $ => $.unsigned_integer,

    /** Specification:
      byte_order = '0' | '1' ; (* 0=big endian, 1=little endian *)
    **/
    byte_order: $ => /[01]/,

    /** Specification:
      value_type = '+' | '-' ; (* +=unsigned, -=signed *)
    **/
    value_type: $ => /[+-]/,

    /** Specification:
      factor = double ;
    **/
    factor: $ => $.double,

    /** Specification:
      offset = double ;
    **/
    offset: $ => $.double,

    /** Specification:
      minimum = double ;
    **/
    minimum: $ => $.double,

    /** Specification:
      maximum = double ;
    **/
    maximum: $ => $.double,
    
    /** Specification:
      unit = char_string ;
    **/
    unit: $ => $.char_string,

    /** Specification:
      receiver = node_name | 'Vector__XXX' ;
    **/
    receiver: $ => choice($.node_name, 'Vector__XXX'),
    
    /** Specification:
      signal_extended_value_type_list = 'SIG_VALTYPE_' message_id signal_name signal_extended_value_type ';' ;
      signal_extended_value_type = '0' | '1' | '2' | '3' ; (* 0=signed or unsigned integer, 1=32-bit IEEE-float, 2=64-bit IEEE-double *)
    **/
    signal_extended_value_type_list: $ => seq('SIG_VALTYPE_', $.message_id, $.signal_name, $.signal_extended_value_type, ';'),

    signal_extended_value_type: $ => /[0123]/,


    // 8.3 Definition of Message Transmitters    
    /** Specification:
      message_transmitters = {message_transmitter} ;
    **/
    message_transmitters: $ => repeat1($.message_transmitter),

    /** Specification:
      message_transmitter = 'BO_TX_BU_' message_id ':' {transmitter} ';' ;
    **/
    message_transmitter: $ => seq('BO_TX_BU_', $.message_id, ':', repeat($.transmitter), ';'),

    
    // 8.4 Signal Value Descriptions (Value Encodings)    
    /** Specification:
      value_descriptions = { value_descriptions_for_signal | value_descriptions_for_env_var } ;
    **/
    value_descriptions: $ => repeat1(choice($.value_descriptions_for_signal, $.value_descriptions_for_env_var)),

    /** Specification:
      value_descriptions_for_signal = 'VAL_' message_id signal_name { value_description } ';' ;
    **/
    value_descriptions_for_signal: $ => seq('VAL_', $.message_id, $.signal_name, repeat($.value_description), ';'),

    
    // 9 Environment Variables Definitions
    /** Specification:
      environment_variables = {environment_variable}
      environment_variable = 'EV_' env_var_name ':' env_var_type '[' mini-
      mum '|' maximum ']' unit initial_value ev_id access_type ac-
      cess_node {',' access_node } ';' ;
    **/
    environment_variables: $ => repeat1($.environment_variable),
    environment_variable: $ => seq(
      'EV_', $.env_var_name, ':', $.env_var_type,
      '[', $.minimum, '|', $.maximum, ']',
      $.char_string, $.initial_value, $.ev_id, $.access_type, $.access_node,
      repeat(seq(',', $.access_node)), ';',
    ),

    /** Specification:
      env_var_name = DBC_identifier ;
    **/
    env_var_name: $ => $.dbc_identifier,

    /** Specification:
      env_var_type = '0' | '1' | '2' ; (* 0=integer, 1=float, 2=string *)
    **/
    env_var_type: $ => /[012]/, // 0-int, 1-float, 2-string

    // Note that minimum and maximum are duplicately defined in section 9 and section 8.2
    
    /** Specification:
      initial_value = double ;
    **/
    initial_value: $ => $.double,

    /** Specification:
      ev_id = unsigned_integer ; (* obsolete *)
    **/
    ev_id: $ => $.unsigned_integer,
    
    /** Specification:
      access_type = 'DUMMY_NODE_VECTOR0' | 'DUMMY_NODE_VECTOR1' |
      'DUMMY_NODE_VECTOR2' | 'DUMMY_NODE_VECTOR3' |
      'DUMMY_NODE_VECTOR8000' | 'DUMMY_NODE_VECTOR8001' |
      'DUMMY_NODE_VECTOR8002' | 'DUMMY_NODE_VECTOR8003'; (*
      0=unrestricted, 1=read, 2=write, 3=readWrite, if the value be-
      hind 'DUMMY_NODE_VECTOR' is OR-ed with 0x8000, the value type
      is always string. *)
    **/
    access_type: $ => choice('DUMMY_NODE_VECTOR0', 'DUMMY_NODE_VECTOR1', 'DUMMY_NODE_VECTOR2', 'DUMMY_NODE_VECTOR3', 'DUMMY_NODE_VECTOR8000', 'DUMMY_NODE_VECTOR8001', 'DUMMY_NODE_VECTOR8002', 'DUMMY_NODE_VECTOR8003'),

    /** Specification:
      access_node = node_name | 'VECTOR__XXX' ;
    **/
    access_node: $ => choice($.node_name, 'VECTOR__XXX'),

    /** Specification:
      environment_variables_data = environment_variable_data ;
    **/
    environment_variables_data: $ => repeat1($.environment_variable_data),
    
    /** Specification:
      environment_variable_data = 'ENVVAR_DATA_' env_var_name ':' data_size ';' ;
    **/
    environment_variable_data: $ => seq('ENVVAR_DATA_', $.env_var_name, ':', $.data_size, ';'),
    
    /** Specification:
      data_size = unsigned_integer ;
    **/
    data_size: $ => $.unsigned_integer,

    // 9.1 Environment Variable Value Descriptions
    /** Specification:
      value_descriptions_for_env_var = 'VAL_' env_var_aname { value_description } ';' ;
    **/
    value_descriptions_for_env_var: $ => seq('VAL_', $.env_var_name, optional($.value_description), ';'),

    
    // 10 Signal Type and Signal Group Definitions
    /** Specification:
      signal_types = {signal_type} ;
      signal_type = 'SGTYPE_' signal_type_name ':' signal_size '@' byte_order value_type '(' factor ',' offset ')' '[' minimum '|' maximum ']' unit default_value ',' value_table ';' ;
    **/
    // Note: value_table is reused in the DBC specification; once for the actual value_table definition and then again in the signal type definition as an alias of a value_table_name
    signal_types: $ => repeat1($.signal_type),
    signal_type: $ => seq('SGTYPE_', $.signal_type_name, ':', $.signal_size, '@', $.byte_order, $.value_type, '(', $.factor, ',', $.offset, ')', '[', $.minimum, '|', $.maximum, ']', $.unit, $.default_value, ',', alias($.value_table_name, $.value_table), ';'),

    /** Specification:
      signal_type_name = DBC_identifier ;
    **/
    signal_type_name: $ => $.dbc_identifier,

    /** Specification:
      default_value = double ;
    **/
    default_value: $ => $.double,

    /** Specification:
      signal_type_refs = {signal_type_ref} ;
    **/
    signal_type_refs: $ => repeat1($.signal_type_ref),

    /** Specification:
      signal_type_ref = 'SGTYPE_' message_id signal_name ':' signal_type_name ';' ;
    **/
    signal_type_ref: $ => seq('SGTYPE_', $.message_id, $.signal_name, ':', $.signal_type_name, ';'),
    
    /** Specification:
      signal_groups = 'SIG_GROUP_' message_id signal_group_name repetitions ':' { signal_name } ';' ;
    **/
    signal_groups: $ => seq('SIG_GROUP_', $.message_id, $.signal_group_name, $.repetitions, ':', repeat($.signal_name), ';'),

    /** Specification:
      signal_group_name = DBC_identifier ;
    **/
    signal_group_name: $ => $.dbc_identifier,

    /** Specification:
      repetitions = unsigned_integer ;
    **/
    repetitions: $ => $.unsigned_integer,

    
    // 11 Comments

    /** Specification:
      comments = {comment} ;
    **/
    comments: $ => repeat1($.comment),

    /** Specification:
      comment = 'CM_' (char_string |
        'BU_' node_name char_string |
        'BO_' message_id char_string |
        'SG_' message_id signal_name char_string |
        'EV_' env_var_name char_string)
        ';' ;
    **/
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


    // 12 User Defined Attribute Definitions
    
    // 12.1 Attribute Definitions
    /** Specification:
      attribute_definitions = { attribute_definition } ;
      attribute_definition = 'BA_DEF_' object_type attribute_name attribute_value_type ';' ;
    **/
    attribute_definitions: $ => repeat1($.attribute_definition),
    attribute_definition: $ => seq(
      'BA_DEF_',
      optional($.object_type),
      $.attribute_name, 
      $.attribute_value_type, 
      ';'
    ),

    /** Specification:
      object_type = '' | 'BU_' | 'BO_' | 'SG_' | 'EV_' ;
    **/
    object_type: $ => choice('BU_', 'BO_', 'SG_', 'EV_'),
    // Note: the empty string option of object_type is satisfied with the optional() function in attribute_definition. This is to satisfy tree-sitter's rules.

    /** Specification:
      attribute_name = '"' DBC_identifier '"' ;
    **/
    attribute_name: $ => seq('"', $.dbc_identifier, '"'),

    /** Specification:
      attribute_value_type = 'INT' signed_integer signed_integer |
        'HEX' signed_integer signed_integer |
        'FLOAT' double double |
        'STRING' |
        'ENUM' [char_string {',' char_string}]
    **/
    attribute_value_type: $ => choice(
      seq('INT', $.signed_integer, $.signed_integer),
      seq('HEX', $.signed_integer, $.signed_integer),
      seq('FLOAT', $.double, $.double),
      'STRING',
      seq('ENUM', optional(seq($.char_string, repeat(seq(',', $.char_string)))))
    ),

    /** Specification:
      attribute_defaults = { attribute_default } ;
    **/
    attribute_defaults: $ => repeat1($.attribute_default),

    /** Specification:
      attribute_default = 'BA_DEF_DEF_' attribute_name attribute_value ';' ;
    **/
    attribute_default: $ => prec(2, seq(
      'BA_DEF_DEF_',
      $.attribute_name,
      $.attribute_value,
      ';'
    )),

    /** Specification:
      attribute_value = unsigned_integer | signed_integer | double |
      char_string ;
    **/
    attribute_value: $ => choice($.unsigned_integer, $.signed_integer, $.double, $.char_string),


    // 12.2 Attribute Values    
    /** Specification:
      attribute_values = { attribute_value_for_object } ;
    **/
    attribute_values: $ => repeat1($.attribute_value_for_object),

    /** Specification:
      attribute_value_for_object = 'BA_' attribute_name (attribute_value |
        'BU_' node_name attribute_value |
        'BO_' message_id attribute_value |
        'SG_' message_id signal_name attribute_value |
        'EV_' env_var_name attribute_value)
        ';' ;
    **/
    attribute_value_for_object: $ => seq(
      'BA_', 
      $.attribute_name, 
      choice(
        $.attribute_value,
        seq('BU_', $.node_name, $.attribute_value),
        seq('BO_', $.message_id, $.attribute_value),
        seq('SG_', $.message_id, $.signal_name, $.attribute_value),
        seq('EV_', $.env_var_name, $.attribute_value)
      ),
      ';'
    ),

    // 13 Extended Multiplexing
    /** Specification:
      extended multiplexing = {multiplexed signal} ;
    **/
    extended_multiplexing: $ => repeat1($.multiplexed_signal),

    /** Specification:
      multiplexed signal = SG_MUL_VAL_ message_id multiplexed_signal_name multiplexor_switch_name multiplexor_value_ranges ';' ;
    **/
    multiplexed_signal: $ => seq('SG_MUL_VAL_', $.message_id, $.multiplexed_signal_name, $.multiplexor_switch_name, $.multiplexor_value_ranges, ';'),

    /** Specification:
      multiplexed_signal_name = DBC_identifier ;
      multiplexor_switch_name = DBC_identifier ;
    **/
    multiplexed_signal_name: $ => $.dbc_identifier,
    multiplexor_switch_name: $ => $.dbc_identifier,

    /** Specification:
      multiplexor_value_ranges = {multiplexor_value_range} ;
      multiplexor_value_range = unsigned_integer '-' unsigned_integer ;
    **/
    multiplexor_value_ranges: $ => repeat1($.multiplexor_value_range),
    multiplexor_value_range: $ => seq($.unsigned_integer, '-', $.unsigned_integer),

   }
})
