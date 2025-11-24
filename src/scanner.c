#include "tree_sitter/alloc.h"
#include "tree_sitter/array.h"
#include "tree_sitter/parser.h"

#include <stdint.h>
#include <string.h>
#include <stdbool.h>

enum TokenType {
  NEWLINE,
  INDENT,
  DEDENT,
};

typedef struct {
  Array(uint16_t) indents;
} Scanner;

static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

bool tree_sitter_haml_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  Scanner *scanner = (Scanner *)payload;

  lexer->mark_end(lexer);

  bool found_newline = false;
  uint32_t indent_length = 0;

  // Consume leading whitespace & detect newline
  for (;;) {
    if (lexer->lookahead == '\n') {
      found_newline = true;
      indent_length = 0;
      skip(lexer);
    } else if (lexer->lookahead == ' ') {
      indent_length++;
      skip(lexer);
    } else if (lexer->lookahead == '\t') {
      indent_length += 8; // assume tab = 8 spaces
      skip(lexer);
    } else if (lexer->lookahead == '\r' || lexer->lookahead == '\f') {
      skip(lexer);
    } else if (lexer->eof(lexer)) {
      found_newline = true;
      indent_length = 0;
      break;
    } else {
      break;
    }
  }

  if (!found_newline) return false;

  uint16_t current_indent = *array_back(&scanner->indents);

  // INDENT
  if (valid_symbols[INDENT] && indent_length > current_indent) {
    array_push(&scanner->indents, indent_length);
    lexer->result_symbol = INDENT;
    return true;
  }

  // DEDENT
  if (valid_symbols[DEDENT] && indent_length < current_indent) {
    array_pop(&scanner->indents);
    lexer->result_symbol = DEDENT;
    return true;
  }

  // NEWLINE
  if (valid_symbols[NEWLINE]) {
    lexer->result_symbol = NEWLINE;
    return true;
  }

  return false;
}

unsigned tree_sitter_haml_external_scanner_serialize(void *payload, char *buffer) {
  Scanner *scanner = (Scanner *)payload;

  unsigned size = 0;
  for (unsigned i = 0; i < scanner->indents.size && size < TREE_SITTER_SERIALIZATION_BUFFER_SIZE; i++) {
    buffer[size++] = (char)*array_get(&scanner->indents, i);
  }

  return size;
}

void tree_sitter_haml_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  Scanner *scanner = (Scanner *)payload;

  array_delete(&scanner->indents);
  array_init(&scanner->indents);
  array_push(&scanner->indents, 0);

  for (unsigned i = 0; i < length; i++) {
    array_push(&scanner->indents, (unsigned char)buffer[i]);
  }
}

void *tree_sitter_haml_external_scanner_create() {
  Scanner *scanner = ts_calloc(1, sizeof(Scanner));
  array_init(&scanner->indents);
  array_push(&scanner->indents, 0);
  return scanner;
}

void tree_sitter_haml_external_scanner_destroy(void *payload) {
  Scanner *scanner = (Scanner *)payload;
  array_delete(&scanner->indents);
  ts_free(scanner);
}
