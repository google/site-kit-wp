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

module.exports = {
	'acronym-case': require( './acronym-case' ),
	'jsdoc-capitalization': require( './jsdoc-capitalization' ),
	'jsdoc-fullstop': require( './jsdoc-fullstop' ),
	'jsdoc-newlines': require( './jsdoc-newlines' ),
	'jsdoc-requires-since': require( './jsdoc-requires-since.js' ),
	'jsdoc-tag-grouping': require( './jsdoc-tag-grouping' ),
	'jsdoc-tag-order': require( './jsdoc-tag-order' ),
	'jsdoc-third-person': require( './jsdoc-third-person' ),
	'no-yield-dispatch': require( './no-yield-dispatch' ),
};
