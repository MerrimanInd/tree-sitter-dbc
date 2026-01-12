package tree_sitter_dbc_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_dbc "github.com/merrimanind/tree-sitter-dbc/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_dbc.Language())
	if language == nil {
		t.Errorf("Error loading CAN DBC grammar")
	}
}
