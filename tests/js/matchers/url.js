/**
 * URL matchers for Jest.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

const matchers = {
	toMatchQueryParameters( receivedURL, expected ) {
		const matcherName = 'toMatchQueryParameters';
		const options = {
			isNot: this.isNot,
			promise: this.promise,
		};

		const { equals, utils } = this;
		const {
			iterableEquality,
			subsetEquality,
			matcherHint,
			stringify,
			printExpected,
			printReceived,
		} = utils;

		// Support passing a relative URL - the base doesn't matter.
		if ( receivedURL.match( /^\// ) ) {
			receivedURL = `http://example.com${ receivedURL }`;
		}
		const url = new URL( receivedURL );
		const received = Array.from( url.searchParams )
			.reduce( ( object, [ key, value ] ) => {
				object[ key ] = value;

				return object;
			}, {} );

		const pass = equals( received, expected, [ iterableEquality, subsetEquality ] );

		const message = pass
			? () =>
				matcherHint( matcherName, undefined, undefined, options ) +
				'\n\n' +
				`Expected: not ${ printExpected( expected ) }` +
				( stringify( expected ) !== stringify( received )
					? `\nReceived:     ${ printReceived( received ) }`
					: '' )
			: () =>
				matcherHint( matcherName, undefined, undefined, options ) +
				'\n\n' +
				printExpected( expected ) +
				'\n\n' +
				printReceived( received )
				;

		return { message, pass };
	},
};
expect.extend( matchers );
