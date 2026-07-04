/**
 * Tabbable mock.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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

// Mocking tabbable as per https://github.com/focus-trap/tabbable#testing-in-jsdom
// Load the tabbable version used by focus-trap-react since another version of tabbable is
// being used by MDC components.
const lib = jest.requireActual( 'focus-trap-react/node_modules/tabbable' );

const tabbable = {
	...lib,
	isFocusable: ( node, options ) =>
		lib.isFocusable( node, { ...options, displayCheck: 'none' } ),
	isTabbable: ( node, options ) =>
		lib.isTabbable( node, { ...options, displayCheck: 'none' } ),
	tabbable: ( node, options ) =>
		lib.tabbable( node, { ...options, displayCheck: 'none' } ),
	focusable: ( node, options ) =>
		lib.focusable( node, { ...options, displayCheck: 'none' } ),
};

module.exports = tabbable;
