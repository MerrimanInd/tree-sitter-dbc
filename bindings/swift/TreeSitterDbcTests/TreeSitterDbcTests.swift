import XCTest
import SwiftTreeSitter
import TreeSitterDbc

final class TreeSitterDbcTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_dbc())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading CAN DBC grammar")
    }
}
