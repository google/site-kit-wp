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
 * External dependencies
 */
import type { ElementHandle } from '@playwright/test';

/**
 * Internal dependencies
 */
import { type DefaultOptions, getDefaultOptions } from './default-options';

/**
 * A page or element handle that the matchers search in.
 */
export interface ElementRoot {
	$$( selector: string ): Promise< ElementHandle[] >;
}

export interface ElementMatcherOptions extends Partial< DefaultOptions > {
	// Text the element must contain. A regular expression is tested instead.
	text?: string | RegExp;
	// Whether the element must be visible.
	visible?: boolean;
	// Mouse button for `toClick`.
	button?: 'left' | 'right' | 'middle';
}

type ResolvedOptions = ElementMatcherOptions & DefaultOptions;

/**
 * Checks whether an element's text matches the expected text.
 *
 * A string matches as a substring of `textContent`. A regular expression is
 * tested against it.
 *
 * @since n.e.x.t
 *
 * @param content Element text content.
 * @param text    Expected text.
 * @return Whether the text matches.
 */
function textMatches( content: string, text?: string | RegExp ) {
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
 * @param root            Page or element handle.
 * @param selector        CSS selector.
 * @param options         Matcher options.
 * @param options.text    Expected text.
 * @param options.visible Whether the element must be visible.
 * @return Matching element handles.
 */
export async function findMatches(
	root: ElementRoot,
	selector: string,
	{ text, visible }: ElementMatcherOptions
) {
	const matches: ElementHandle[] = [];
	for ( const handle of await root.$$( selector ) ) {
		const content = await handle.evaluate(
			( element ) => element.textContent || ''
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
 * @param condition       Async function to poll.
 * @param options         Timeout and polling interval.
 * @param options.timeout Maximum time to poll, in milliseconds.
 * @param options.polling Time between polls, in milliseconds.
 * @return The last value `condition()` returned.
 */
export async function poll< T >(
	condition: () => Promise< T >,
	{ timeout, polling }: DefaultOptions
): Promise< T > {
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
 * @param selector     CSS selector.
 * @param options      Matcher options.
 * @param options.text Expected text.
 * @return Description, e.g. `.foo (text: "Bar")`.
 */
export function describeTarget(
	selector: string,
	{ text }: ElementMatcherOptions
) {
	return text === undefined
		? selector
		: `${ selector } (text: "${ String( text ) }")`;
}

/**
 * Merges matcher options into the default options.
 *
 * @since n.e.x.t
 *
 * @param options Matcher options.
 * @return Options with defaults applied.
 */
export function withDefaultOptions(
	options: ElementMatcherOptions = {}
): ResolvedOptions {
	return { ...getDefaultOptions(), ...options };
}

/**
 * Waits for an element to match, then returns its handle.
 *
 * @since n.e.x.t
 *
 * @param root     Page or element handle.
 * @param selector CSS selector.
 * @param options  Matcher options.
 * @return Element handle.
 */
export async function waitForMatch(
	root: ElementRoot,
	selector: string,
	options: ResolvedOptions
) {
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
