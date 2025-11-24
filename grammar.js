/**
 * @file HAML Parser
 * @author Bohdan Shushval <bohdanshushval@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'haml',

  conflicts: $ => [
    [$._node, $.block]
  ],

  externals: $ => [
    $._newline,
    $._indent,
    $._dedent
  ],

  rules: {
    document: $ => repeat($._node),

    _node: $ => choice(
      $.block,
      $.tag,
      $.plain_text,
      $.ruby_code,
      $.filter
    ),

    ruby_code: $ => seq(
      optional($._indent),
      choice('-', '='),
      $._text,
      $._newline
    ),

    filter_name: $ => /[a-zA-Z]+/,

    _filter_declaration: $ => seq(
      ':',
      $.filter_name,
      $._newline,
    ),

    _filter_text: $ => /[^\s]+/,

    filter_content: $ => seq(
      repeat1($._filter_text),
    ),

    filter: $ => seq(
      prec.right(
        seq(
          $._filter_declaration,
          optional(
            seq(
              $._indent,
              $.filter_content,
              $._dedent
            )
          )
        )
      )
    ),

    tag: $ => seq(
      '%',
      $.tag_name,
      $._newline
    ),

    tag_name: $ => /[a-zA-Z0-9:_-]+/,

    block: $ => seq(
      $.tag,
      $._indent,
      repeat($._node),
      $._dedent
    ),

    _text: $ => /[^%\-="\.#\s:].+/,

    plain_text: $ => seq(
      optional($._indent),
      $._text,
      $._newline
    ),

  }
})
