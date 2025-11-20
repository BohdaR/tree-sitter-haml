/**
 * @file HAML Parser
 * @author Bohdan Shushval <bohdanshushval@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'haml',

  externals: $ => [
    $._newline,
    $._indent,
    $._dedent,
    $.string_start,
    $.string_content,
    $.string_end,
    // TODO: rewrite scanner to support interpolation in string content
    // $.interpolation_start,
    // $.interpolation_content,
    // $.interpolation_end,
    $._comment,

    // Allow the external scanner to check for the validity of closing brackets
    // so that it can avoid returning dedent tokens between brackets.
    ']',
    ')',
    '}',
    $._except
  ],

  rules: {
    document: $ => repeat($._node),

    // either a block or a simple line
    _node: $ => choice(
      $.block,
      $.line,
      $.plain_text
    ),

    // a line like: %div
    line: $ => seq(
      $.tag,
      $._newline
    ),

    plain_text: $ => seq(
      /[a-zA-Z0-9:_-]+/,
      $._newline
    ),

    // %something
    tag: $ => seq(
      '%',
      $.tag_name
    ),

    tag_name: $ => /[a-zA-Z0-9:_-]+/,

    block: $ => seq(
      $.tag,          // %div
      $._newline,      // end-of-line
      $._indent,       // scanner opened indent block
      repeat($._node),// nested things
      $._dedent        // scanner closed block
    ),
  }
})
