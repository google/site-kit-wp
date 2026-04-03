/**
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * SWC compiles named ES module exports as Object.defineProperty() getter calls
 * with no `configurable` flag (so it defaults to false). Jest's spyOn() and
 * jest.mock() require configurable: true to be able to replace those properties.
 *
 * This wrapper calls @swc/jest and then patches every export getter definition
 * to add `configurable: true`, matching what Babel's CJS transform produces.
 */

const { createTransformer: swcCreateTransformer } = require( '@swc/jest' );

function makeExportsConfigurable( code ) {
	// Matches the SWC-emitted pattern:
	//   enumerable: true,
	//       get: function() { ... }
	// and inserts configurable: true between them.
	return code.replace(
		/(enumerable:\s*true,\n)(\s*)(get:)/g,
		'$1$2configurable: true,\n$2$3'
	);
}

// Jest calls createTransformer( config ) when the transform is specified as
// [ 'path/to/transformer', config ]. We must forward `options` to @swc/jest so
// it computes the correct SWC options (parser syntax, JSX, TypeScript, etc.).
function createTransformer( options ) {
	const transformer = swcCreateTransformer( options );
	return {
		...transformer,
		process( sourceText, sourcePath, jestOptions ) {
			const result = transformer.process(
				sourceText,
				sourcePath,
				jestOptions
			);
			return {
				...result,
				code: makeExportsConfigurable( result.code ),
			};
		},
		async processAsync( sourceText, sourcePath, jestOptions ) {
			const result = await transformer.processAsync(
				sourceText,
				sourcePath,
				jestOptions
			);
			return {
				...result,
				code: makeExportsConfigurable( result.code ),
			};
		},
	};
}

module.exports = { createTransformer };
