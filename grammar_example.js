/**
 * @file CANbus DBC bus decriptor file format
 * @author Xander Cesari <xander@merriman.industries>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "dbc",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
