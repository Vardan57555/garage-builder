import stylistic from "@stylistic/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
    {
        files: ["**/*.ts"],
        ignores: [
            "node_modules/",
            "package.json",
            "package-lock.json",
            "pnpm-lock.yaml",
            "openapi/",
            "postman/",
            "build/**",
            "dist/**",
            "node_modules/**",
            "coverage/**",
            "source/tests/api/**"
        ]
    },
    {
        plugins: {
            "@stylistic": stylistic
        },

        languageOptions: {
            ecmaVersion: 6,
            sourceType: "module",
            parser: tsParser,

            parserOptions: {
                ecmaVersion: 2023,
                project: "./tsconfig.json"
            }
        },

        rules: {
            "prefer-const": "error",

            "padding-line-between-statements": [
                "error",
                {
                    blankLine: "always",
                    prev: "block-like",
                    next: "expression"
                },
                {
                    blankLine: "always",
                    prev: "expression",
                    next: "block-like"
                },
                {
                    blankLine: "always",
                    prev: [
                        "const",
                        "let"
                    ],
                    next: "block-like"
                },
                {
                    blankLine: "always",
                    prev: "*",
                    next: "return"
                }
            ],

            "no-multiple-empty-lines": [
                "error",
                {
                    max: 1
                }
            ],

            "space-infix-ops": [
                "error",
                {
                    int32Hint: false
                }
            ],

            "space-unary-ops": [
                1,
                {
                    words: true,
                    nonwords: false
                }
            ],

            "keyword-spacing": [
                "error",
                {
                    before: true,
                    after: true
                }
            ],

            "space-in-parens": [
                "error",
                "never"
            ],

            "no-multi-spaces": [
                "error",
                {
                    ignoreEOLComments: true
                }
            ],

            "padded-blocks": [
                "error",
                "never"
            ],

            "@stylistic/member-delimiter-style": [
                "error",
                {
                    multiline: {
                        delimiter: "semi",
                        requireLast: true
                    },

                    singleline: {
                        delimiter: "semi",
                        requireLast: false
                    }
                }
            ],
            "@stylistic/quotes": [
                "error",
                "double"
            ],
            "@stylistic/semi": [
                "error",
                "always"
            ],
            "@stylistic/type-annotation-spacing": "error",
            "@stylistic/brace-style": [
                "error",
                "allman"
            ],

            "@stylistic/indent": [
                "error",
                4,
                {
                    SwitchCase: 1
                }
            ],

            eqeqeq: [
                "error",
                "smart"
            ],

            "id-blacklist": [
                "error",
                "any",
                "Number",
                "number",
                "String",
                "string",
                "Boolean",
                "boolean",
                "Undefined",
                "undefined"
            ],

            "id-match": "error",
            "no-eval": "error",
            "no-trailing-spaces": "error",
            "no-var": "error",
            "one-var": [
                "error",
                "never"
            ],

            "spaced-comment": [
                "error",
                "always",
                {
                    markers: ["/"]
                }
            ],

            "object-curly-spacing": [
                "error",
                "always"
            ],
            "comma-dangle": [
                "error",
                "never"
            ],

            "comma-spacing": [
                "error",
                {
                    before: false,
                    after: true
                }
            ],

            "template-curly-spacing": [
                "error",
                "never"
            ],

            "array-bracket-newline": [
                "error",
                {
                    multiline: true,
                    minItems: 2
                }
            ],

            "switch-colon-spacing": [
                "error",
                {
                    after: true,
                    before: false
                }
            ],

            "array-element-newline": [
                "error",
                {
                    multiline: true,
                    minItems: 2
                }
            ],

            "no-fallthrough": "error",
            "eol-last": [
                "error",
                "always"
            ],
            "no-unneeded-ternary": "error",
            "no-duplicate-imports": "error",

            "sort-imports": [
                "error",
                {
                    ignoreCase: true,
                    ignoreDeclarationSort: true,
                    ignoreMemberSort: false,
                    memberSyntaxSortOrder: [
                        "none",
                        "all",
                        "multiple",
                        "single"
                    ]
                }
            ]
        }
    }
];
