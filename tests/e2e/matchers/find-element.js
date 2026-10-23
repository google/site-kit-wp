/**
 * Element lookup shared by the element matchers.
 *
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
 * Internal dependencies
 */
import { getDefaultOptions } from './default-options';

/**
 * Checks whether an element's text matches the expected text.
 *
 * A string matches as a substring of `textContent`. A regular expression is
 * tested against it.
 *
 * @since n.e.x.t
 *
 * @param {string}             content Element text content.
 * @param {string|RegExp|void} text    Expected text.
 * @return {boolean} Whether the text matches.
 */
function textMatches( content, text ) {
	if ( text === undefined ) {
		return true;
	}
	return text instanceof RegExp
		? text.test( content )
		: content.includes( text );
}

/**
 * Finds the elements under `root` that match a selector and options.
 *
 * @since n.e.x.t
 *
 * @param {Object}             root            Page or element handle.
 * @param {string}             selector        CSS selector.
 * @param {Object}             options         Matcher options.
 * @param {string|RegExp|void} options.text    Expected text.
 * @param {boolean}            options.visible Whether the element must be visible.
 * @return {Promise<Array>} Matching element handles.
 */
export async function findMatches( root, selector, { text, visible } ) {
	const matches = [];
	for ( const handle of await root.$$( selector ) ) {
		const content = await handle.evaluate(
			( element ) => element.textContent
		);
		if ( ! textMatches( content, text ) ) {
			continue;
		}
		if ( visible && ! ( await handle.isVisible() ) ) {
			continue;
		}
		matches.push( handle );
	}
	return matches;
}

/**
 * Polls until `condition()` returns a truthy value or the timeout passes.
 *
 * @since n.e.x.t
 *
 * @param {Function} condition       Async function to poll.
 * @param {Object}   options         Timeout and polling interval.
 * @param {number}   options.timeout Maximum time to poll, in milliseconds.
 * @param {number}   options.polling Time between polls, in milliseconds.
 * @return {Promise<*>} The last value `condition()` returned.
 */
export async function poll( condition, { timeout, polling } ) {
	// Elapsed test time, so the reference date does not apply.
	const start = Date.now(); // eslint-disable-line sitekit/no-direct-date
	for (;;) {
		const value = await condition();
		// eslint-disable-next-line sitekit/no-direct-date
		if ( value || Date.now() - start >= timeout ) {
			return value;
		}
		await new Promise( ( resolve ) => setTimeout( resolve, polling ) );
	}
}

/**
 * Describes a selector and text for failure messages.
 *
 * @since n.e.x.t
 *
 * @param {string}             selector     CSS selector.
 * @param {Object}             options      Matcher options.
 * @param {string|RegExp|void} options.text Expected text.
 * @return {string} Description, e.g. `.foo (text: "Bar")`.
 */
export function describeTarget( selector, { text } ) {
	return text === undefined
		? selector
		: `${ selector } (text: "${ String( text ) }")`;
}

/**
 * Merges matcher options into the default options.
 *
 * @since n.e.x.t
 *
 * @param {Object} options Matcher options.
 * @return {Object} Options with defaults applied.
 */
export function withDefaultOptions( options = {} ) {
	return { ...getDefaultOptions(), ...options };
}

/**
 * Waits for an element to match, then returns its handle.
 *
 * @since n.e.x.t
 *
 * @param {Object} root     Page or element handle.
 * @param {string} selector CSS selector.
 * @param {Object} options  Matcher options.
 * @return {Promise<Object>} Element handle.
 */
export async function waitForMatch( root, selector, options ) {
	const matches = await poll( async () => {
		const found = await findMatches( root, selector, options );
		return found.length ? found : null;
	}, options );

	if ( ! matches ) {
		throw new Error(
			`Element ${ describeTarget( selector, options ) } not found`
		);
	}
	return matches[ 0 ];
}
