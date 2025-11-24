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

    filter_name: $ => /[a-zA-Z0-9_-]+/,

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
      // Tag name
      choice(
        $.tag_name,
        $.tag_class,
        $.tag_id,
      ),
      // Class/id list
      repeat(
        choice(
          $.tag_class,
          $.tag_id
        )
      ),
      // Make sure each attribute appears at most one time.
      choice(
        seq(optional($.hash_attributes), optional($.list_attributes), optional($.object_reference)),
        seq(optional($.hash_attributes), optional($.object_reference), optional($.list_attributes)),
        seq(optional($.list_attributes), optional($.hash_attributes), optional($.object_reference)),
        seq(optional($.list_attributes), optional($.object_reference), optional($.hash_attributes)),
        seq(optional($.object_reference), optional($.hash_attributes), optional($.list_attributes)),
        seq(optional($.object_reference), optional($.list_attributes), optional($.hash_attributes)),
      ),
      // Whitespace Removal
      optional(choice('>', '<', '<>', '><')),
      // Self-closing (void tags)
      optional('/'),
      // End of tag
      $._newline
    ),

    tag_name: _ => /%[-:\w]+/,
    tag_class: _ => /\.[-:\w]+/,
    tag_id: _ => /#[-:\w]+/,

    object_reference: _ => seq(
      '[',
      repeat(/[^\[\]]/),  // anything except brackets
      ']'
    ),

    hash_attributes: _ => seq(
      '{',
      repeat(/[^{}]/),     // anything except braces
      '}'
    ),

    list_attributes: _ => seq(
      '(',
      repeat(/[^()]/),     // anything except parentheses
      ')'
    ),

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
