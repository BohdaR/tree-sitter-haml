;; --- Doctype ---
(doctype
  "!!!" @keyword
  (doctype_name)? @string.special)

;; --- Tags (%p, .cls, #id) ---
(tag_name) @tag
(tag_class) @attribute
(tag_id) @attribute

;; Object reference [Foo]
(object_reference) @punctuation.bracket

;; --- Attributes ---
(hash_attributes
  "{" @punctuation.bracket
  "}" @punctuation.bracket)

(list_attributes
  "(" @punctuation.bracket
  ")" @punctuation.bracket)

;; --- Filters (:javascript, :markdown) ---
(filter
  ":" @punctuation.special
  (filter_name) @constant.builtin)

(filter_body) @string

;; --- Ruby Code ---
(ruby_insert
  "=" @operator             ;; normal insert
  (ruby_code) @embedded)    ;; code inside

(ruby_insert
  "~" @operator)            ;; whitespace preservation
(ruby_insert
  "&=" @operator)           ;; escape
(ruby_insert
  "!=" @operator)           ;; unescape

(running_ruby
  "-" @operator
  (ruby_code) @embedded)

(ruby_code) @embedded

;; --- Plain text ---
(plain_text) @string

;; --- Whitespace control flags '>', '<', '<>', '><' ---
(tag
  ">" @punctuation.special)
(tag
  "<" @punctuation.special)
(tag
  "<>" @punctuation.special)
(tag
  "><" @punctuation.special)
