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
    $._dedent
  ],

  rules: {
    document: $ => repeat(
      choice(
        $.doctype,
        $.tag,
        $.ruby_insert,
        $.running_ruby,
        $.filter,
        $.plain_text
      )
    ),

    doctype: $ => seq(
      "!!!",
      optional(alias($._text, $.doctype_name)),
      $._newline,
    ),

    ruby_insert: $ => seq(
      choice(
        '=',
        '~',  // Whitespace Preservation
        '&=', // Escaping HTML
        '!=', // Unescaping HTML
      ),
      $.ruby_code,
      $._newline,
      optional($._block_content)
    ),

    running_ruby: $ => seq(
      '-',
      $.ruby_code,
      $._newline,
      optional($._block_content)
    ),

    ruby_code: _ => token(
      prec(1,
        seq(
          /[^\n]+/,
          repeat(
            seq(
              /,[ \t]*\n[ \t]*/,
              /[^\n]+/,
            ),
          ),
        ),
      ),
    ),

    _text: $ => /[^\n]+/,

    plain_text: _ => token(prec(-1, /[^\n]+/)),

    filter_name: $ => /[a-zA-Z0-9_-]+/,

    filter_body: $ => seq(
      repeat1($._text),
    ),

    filter: $ => seq(
      ':',
      $.filter_name,
      choice(
        $._newline,
        seq(
          $._newline,
          $._indent,
          $.filter_body,
          $._dedent
        )
      ),
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

      // Either a closing tag or inline content or block content.
      choice(
        // Either a closing tag or inline content.
        seq(
          optional(
            choice(
              // Self-closing (void tags)
              '/',

              // Inline content.
              $._inline_content,
            ),
          ),

          // End of tag
          $._newline
        ),
        seq(
          // End of tag
          $._newline,
          $._block_content,
        )
      )
    ),

    _inline_content: $ => choice(
      $.ruby_insert,
      $.plain_text
    ),

    _block_content: $ => seq(
      $._indent,
      repeat(
        choice(
          $.tag,
          $.ruby_insert,
          $.running_ruby,
          $.plain_text,
          $.filter
        )
      ),
      $._dedent
    ),

    tag_name: _ => /%[-:\w]+/,
    tag_class: _ => /\.[-:\w]+/,
    tag_id: _ => /#[-:\w]+/,

    object_reference: _ => seq(
      '[',
      repeat(/[^\[\]]/),  // anything except brackets
      ']'
    ),

    hash_attributes: $ => seq(
      '{',
      optional($._hash_attribute_content),
      '}'
    ),

    _hash_attribute_content: $ => repeat1(
      choice(
        /[^{}]/,                             // normal chars
        $._nested_hash_attributes
      )
    ),

    // Hidden rule for nested hashes
    _nested_hash_attributes: $ => seq(
      '{',
      optional($._hash_attribute_content),
      '}'
    ),

    list_attributes: _ => seq(
      '(',
      repeat(/[^()]/),     // anything except parentheses
      ')'
    ),
  }
})
