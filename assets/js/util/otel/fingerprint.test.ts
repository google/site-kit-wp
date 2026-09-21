/**
 * Fingerprint tests.
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
import { TextEncoder } from 'util';

/**
 * Internal dependencies
 */
import {
	fnv1a32,
	getFingerprint,
	normalizeForFingerprint,
} from './fingerprint';

// jsdom does not provide TextEncoder, which every browser Site Kit runs in
// has had for close to a decade. Polyfilling here keeps the production code
// free of a fallback path that could never execute — and, more importantly,
// could never be exercised, so it would be a second unverified implementation
// of a hash that has to stay byte-identical across languages.
global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;

describe( 'fingerprint', () => {
	describe( 'normalizeForFingerprint', () => {
		it( 'strips minified identifiers but keeps the property name', () => {
			// The identifier before the dot is assigned by the minifier and
			// changes between releases; the property after it does not.
			expect(
				normalizeForFingerprint( "'(0 , l.useDispatch)(...)'" )
			).toBe( "'(0 , *.useDispatch)(...)'" );
		} );

		it( 'strips URLs, which differ per site', () => {
			expect(
				normalizeForFingerprint( 'at Foo (https://example.com/a.js)' )
			).toBe( 'at Foo (<url>)' );
		} );

		it( 'keeps short numbers that carry meaning', () => {
			// React error codes identify the bug; removing them would merge
			// genuinely different errors into one issue.
			expect(
				normalizeForFingerprint( 'Minified React error #152' )
			).toBe( 'Minified React error #152' );
		} );

		it( 'strips long digit runs, which are IDs rather than identity', () => {
			expect( normalizeForFingerprint( 'property 123456789' ) ).toBe(
				'property <n>'
			);
		} );

		it( 'does not mistake a plain number for a build hash', () => {
			// Digits are valid hex characters, so the build-hash rule has to
			// require at least one a–f or it swallows IDs and dates.
			// Claimed by the digit rule as an ID, not by the hash rule — if
			// the hash rule matched first this would read '<hash>'.
			expect( normalizeForFingerprint( 'built 20260920' ) ).toBe(
				'built <n>'
			);
			expect( normalizeForFingerprint( 'chunk a3f9c2e1b7d4' ) ).toBe(
				'chunk <hash>'
			);
		} );

		it( 'handles empty and non-string input', () => {
			expect( normalizeForFingerprint( '' ) ).toBe( '' );
			expect(
				normalizeForFingerprint( undefined as unknown as string )
			).toBe( '' );
		} );
	} );

	describe( 'fnv1a32', () => {
		it( 'is deterministic', () => {
			expect( fnv1a32( 'site-kit' ) ).toBe( fnv1a32( 'site-kit' ) );
		} );

		it( 'returns eight hex characters', () => {
			expect( fnv1a32( 'site-kit' ) ).toMatch( /^[0-9a-f]{8}$/ );
		} );

		it( 'matches the reference FNV-1a 32-bit value', () => {
			// Pins the algorithm so the PHP implementation can be verified
			// against the same vector. Changing this breaks cross-language
			// grouping, so it should never change silently.
			expect( fnv1a32( 'a' ) ).toBe( 'e40c292c' );
			expect( fnv1a32( 'foobar' ) ).toBe( 'bf9cf968' );
		} );
	} );

	describe( 'getFingerprint', () => {
		// The exact error from the production GA dashboard, as it appears
		// across three releases. The minified identifier and the site URL
		// differ; the bug does not.
		const message = ( minified: string ) =>
			`Cannot destructure property 'triggerTourForView' of '(0 , ${ minified }.useDispatch)(...)' as it is null.`;

		const stack = ( host: string, line: number ) =>
			`at FeatureTours (https://${ host }/dist/main.js:2:${ line })`;

		it( 'groups the same bug across releases and sites', () => {
			const a = getFingerprint(
				'TypeError',
				message( 'l' ),
				stack( 'a.com', 184913 )
			);
			const b = getFingerprint(
				'TypeError',
				message( 'e' ),
				stack( 'b.org', 190221 )
			);
			const c = getFingerprint(
				'TypeError',
				message( 'xy' ),
				stack( 'c.net', 201447 )
			);

			expect( a ).toBe( b );
			expect( b ).toBe( c );
		} );

		it( 'separates different bugs that share a shape', () => {
			// Same error type, same call pattern, different property — these
			// are distinct bugs and must not be merged.
			const tourBug = getFingerprint(
				'TypeError',
				message( 'l' ),
				stack( 'a.com', 184913 )
			);
			const goalsBug = getFingerprint(
				'TypeError',
				"Cannot destructure property 'clearSiteGoalsBreakdownTooltipPending' of '(0 , l.useDispatch)(...)' as it is null.",
				stack( 'a.com', 99001 )
			);

			expect( tourBug ).not.toBe( goalsBug );
		} );

		it( 'separates different error types with identical messages', () => {
			expect( getFingerprint( 'TypeError', 'Boom' ) ).not.toBe(
				getFingerprint( 'RangeError', 'Boom' )
			);
		} );

		it( 'does not throw on missing input', () => {
			expect( () => getFingerprint( '', '' ) ).not.toThrow();
			expect( getFingerprint( '', '' ) ).toMatch( /^[0-9a-f]{8}$/ );
		} );
	} );
} );
