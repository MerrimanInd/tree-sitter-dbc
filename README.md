# tree-sitter-dbc
A tree-sitter grammar for CAN DBC files

## DBC Files
DBC files describe the nodes, messages, signals, and other signal data of a CAN bus. Since CAN is not a self-describing protocol DBCs are necessary to decode the information broadcast on a bus. More information is available in [CSS Electronics' excellent guide](https://www.csselectronics.com/pages/can-dbc-file-database-intro) (as well as their many other well-written guides on adjacent technologies).

The CAN DBC specification was written and published by Vector Informatik GmbH. The most recent version is 1.0.5, published in 2008. A PDF of the specification is available from Vector's website.

## Errata
The specification contains two ambiguities. Since DBCs have been in reliable use for two decades these are trivial for the actual use of the files but writing a grammar reveals them.

- Section 8.2, pg 5-6: There is no specification for the multiplexer_switch_value. This is referred to in multiplexing but is not defined. I am assuming it maps to an unsigned_integer, as multiplexers are usually treated as simple enumerations without an engineering conversion that would make them signed or floats.

- Section 8.3, pg 7: Strictly speaking the specification only allows a single signal_extended_value_type_list item that sets only one signal type. I believe this is an oversight that has been a non-issue due to this feature being essentially deprecated. I've added an undocumented parse object to iterate through a series of SIG_VALTYPE_ declarations. This aligns with the rest of the top-level declarations and makes the parser more robust. If this can be confirmed to be in error please reach out to me or put in a PR to remove it.

## Bindings
-[x] C
-[x] Go
-[x] Node
-[x] Python
-[x] Rust
-[x] Swift
-[x] Zig
