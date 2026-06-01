/**
 * ESLint rules: custom rules for Site Kit.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * Register `esbuild-register` so Node can `require()` TypeScript rule files at
 * lint time (e.g. via the pre-commit hook or `npm run lint:js`). Jest is
 * unaffected because it transforms TypeScript files via its own Babel transformer.
 */
require( 'esbuild-register/dist/node' ).register();

module.exports = {
	'acronym-case': require( './acronym-case' ),
	'function-declaration-consistency': require( './function-declaration-consistency' ),
	'jsdoc-capitalization': require( './jsdoc-capitalization' ),
	'jsdoc-fullstop': require( './jsdoc-fullstop' ),
	'jsdoc-newlines': require( './jsdoc-newlines' ),
	'jsdoc-no-unnamed-boolean-params': require( './jsdoc-no-unnamed-boolean-params' ),
	'jsdoc-requires-since': require( './jsdoc-requires-since' ),
	'jsdoc-tag-grouping': require( './jsdoc-tag-grouping' ),
	'jsdoc-tag-order': require( './jsdoc-tag-order' ),
	'jsdoc-third-person': require( './jsdoc-third-person' ),
	'no-boolean-props-before-values': require( './no-boolean-props-before-values' ),
	'no-children-prop-type': require( './no-children-prop-type' ),
	'no-direct-date': require( './no-direct-date' ),
	'no-storybook-scenario-label': require( './no-storybook-scenario-label' ),
	'no-yield-dispatch': require( './no-yield-dispatch' ),
	'prefer-interface-props': require( './prefer-interface-props' ),
	'require-exported-component-props': require( './require-exported-component-props' ),
	'sort-import-groups': require( './sort-import-groups' ).default,
};
