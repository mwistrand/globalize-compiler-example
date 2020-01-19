# globalize-compiler example

To generate a bundle that includes the full Globalize.js library and all relevant CLDR data, run `npm run build`. To generate a bundle that precompiles formatters/parsers and switches to the Globalize.js runtime, run `npm run build:compile`. To simplify the example, all AST parsing is stripped away and the Globalize method calls are hard coded in the webpack config.
