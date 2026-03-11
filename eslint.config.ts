import eslintJs from "@eslint/js";
import eslintPrettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";
import { defineConfig } from "eslint/config";
import eslintTs from "typescript-eslint";

export default defineConfig(
    eslintJs.configs.recommended,
    eslintTs.configs.recommendedTypeChecked,
    eslintPrettier,

    {
        languageOptions: {
            parser: eslintTs.parser,
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                projectService: true,
            },
        },

        plugins: {
            import: importPlugin,
        },

        rules: {
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/naming-convention": "error",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            "no-warning-comments": "warn",
            curly: "error",
            eqeqeq: [
                "error",
                "always",
                {
                    null: "never",
                },
            ],
        },
    },

    // Prevent node in exported library
    {
        files: ["src/**/*.ts"],
        ignores: ["src/node/**/*.ts", "src/test/**/*.ts"],
        rules: {
            "import/no-nodejs-modules": "error",
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["**/node/**"],
                            message:
                                "Only files in src/node may import from src/node.",
                        },
                    ],
                },
            ],
        },
    },

    {
        files: ["eslint.config.ts"],
        extends: [eslintTs.configs.disableTypeChecked],
    },
);
