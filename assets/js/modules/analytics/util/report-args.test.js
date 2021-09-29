/**
 * Report Args utility tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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

import { reportArgsToURLSegment } from './report-args';

describe( 'reportArgsToURLSegment', () => {
	it( 'requires a plain object of arguments', () => {
		expect( () => reportArgsToURLSegment() ).toThrow(
			'report args must be a plain object'
		);
	} );

	it( 'encodes an object of arguments into a key-value string', () => {
		expect( reportArgsToURLSegment( { foo: 'bar' } ) ).toBe( 'foo=bar' );
	} );

	it( 'returns an empty string for an object with no keys', () => {
		expect( reportArgsToURLSegment( {} ) ).toBe( '' );
	} );

	it( 'ignores keys with undefined values', () => {
		expect( reportArgsToURLSegment( { foo: 'bar', baz: undefined } ) ).toBe(
			'foo=bar'
		);
	} );

	it( 'joins multiple arguments with an ampersand literal', () => {
		expect( reportArgsToURLSegment( { foo: 'bar', baz: 'buzz' } ) ).toBe(
			'foo=bar&baz=buzz'
		);
	} );

	it( 'url-encodes argument values', () => {
		expect( reportArgsToURLSegment( { foo: 'bar?' } ) ).toBe(
			'foo=bar%3F'
		);
	} );

	it( 'uses a special encoding for slashes', () => {
		expect( reportArgsToURLSegment( { slash: '/' } ) ).toBe( 'slash=~2F' );
	} );

	it( 'uses a special encoding for all slashes in argument values', () => {
		expect( reportArgsToURLSegment( { slash: '//' } ) ).toBe(
			'slash=~2F~2F'
		);
		expect(
			reportArgsToURLSegment( { slash: '//', ask: 'question/?/answer' } )
		).toBe( 'slash=~2F~2F&ask=question~2F%3F~2Fanswer' );
	} );
} );
