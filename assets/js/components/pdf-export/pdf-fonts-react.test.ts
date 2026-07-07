/**
 * Tests for PDF font registration.
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
import {
	PDF_FONT_FAMILY_ARABIC,
	PDF_FONT_FAMILY_DISPLAY,
	PDF_FONT_FAMILY_TEXT,
} from './pdf-theme';

/**
 * Imports fresh copies of the mocked renderer and the module under test.
 *
 * `@react-pdf/renderer` is auto-mocked via `__mocks__/@react-pdf/renderer.js`.
 * The module under test holds a session-scoped registration latch, so each
 * test reloads it (and the mocked renderer) with `jest.resetModules()`.
 *
 * @since 1.182.0
 *
 * @return The mocked `Font` API and the `registerPDFFonts` function.
 */
async function setup() {
	const { Font } = await import( '@react-pdf/renderer' );
	const { registerPDFFonts } = await import( './pdf-fonts-react' );
	return { Font, registerPDFFonts };
}

/**
 * The bundled multi-weight shape registered for each family. It narrows the
 * `SingleLoad | BulkLoad` union the typings expose for `Font.register`.
 */
type FontConfig = {
	family: string;
	fonts: Array< { src: string; fontWeight: number } >;
};

describe( 'registerPDFFonts', () => {
	beforeEach( () => {
		jest.resetModules();
		jest.clearAllMocks();
	} );

	it( 'registers the brand and fallback families with the bundled weights and returns the display family', async () => {
		const { Font, registerPDFFonts } = await setup();

		const family = registerPDFFonts();

		expect( family ).toBe( PDF_FONT_FAMILY_DISPLAY );
		expect( Font.register ).toHaveBeenCalledTimes( 3 );

		const calls = jest.mocked( Font.register ).mock.calls as Array<
			[ FontConfig ]
		>;
		function weightsFor( familyName: string ) {
			return calls
				.find( ( [ config ] ) => config.family === familyName )?.[ 0 ]
				.fonts.map( ( f ) => f.fontWeight );
		}

		expect( weightsFor( PDF_FONT_FAMILY_DISPLAY ) ).toEqual( [ 400, 500 ] );
		expect( weightsFor( PDF_FONT_FAMILY_TEXT ) ).toEqual( [ 400, 500 ] );
		expect( weightsFor( PDF_FONT_FAMILY_ARABIC ) ).toEqual( [ 400, 500 ] );
	} );

	it( 'registers URL strings (not data URIs) as the font src', async () => {
		const { Font, registerPDFFonts } = await setup();

		registerPDFFonts();

		const calls = jest.mocked( Font.register ).mock.calls as Array<
			[ FontConfig ]
		>;
		const sources = calls
			.flatMap( ( [ config ] ) => config.fonts )
			.map( ( { src } ) => src );

		expect( sources ).toHaveLength( 6 );
		sources.forEach( ( src ) => {
			expect( typeof src ).toBe( 'string' );
			expect( src.startsWith( 'data:' ) ).toBe( false );
		} );
	} );

	it( 'registers the Arabic fallback from local self-hosted assets, not a remote URL', async () => {
		const { Font, registerPDFFonts } = await setup();

		registerPDFFonts();

		const calls = jest.mocked( Font.register ).mock.calls as Array<
			[ FontConfig ]
		>;
		const fallbackSources = calls
			.filter(
				( [ config ] ) => config.family === PDF_FONT_FAMILY_ARABIC
			)
			.flatMap( ( [ config ] ) => config.fonts )
			.map( ( { src } ) => src );

		expect( fallbackSources ).toHaveLength( 2 );
		fallbackSources.forEach( ( src ) => {
			expect( typeof src ).toBe( 'string' );
			// The fallbacks are bundled webpack assets, not a remote font host,
			// so the PDF renders without an external request.
			expect( src ).not.toMatch( /^https?:\/\// );
		} );
	} );

	it( 'registers a hyphenation callback that returns the whole word', async () => {
		const { Font, registerPDFFonts } = await setup();

		registerPDFFonts();

		expect( Font.registerHyphenationCallback ).toHaveBeenCalledTimes( 1 );
		const callback = jest.mocked( Font.registerHyphenationCallback ).mock
			.calls[ 0 ][ 0 ];
		expect( callback( 'visitors' ) ).toEqual( [ 'visitors' ] );
	} );

	it( 'is idempotent within a session', async () => {
		const { Font, registerPDFFonts } = await setup();

		registerPDFFonts();
		jest.mocked( Font.register ).mockClear();
		jest.mocked( Font.registerHyphenationCallback ).mockClear();

		registerPDFFonts();

		expect( Font.register ).not.toHaveBeenCalled();
		expect( Font.registerHyphenationCallback ).not.toHaveBeenCalled();
	} );

	it( 'propagates registration errors instead of falling back', async () => {
		const { Font, registerPDFFonts } = await setup();

		jest.mocked( Font.register ).mockImplementationOnce( () => {
			throw new Error( 'register failed' );
		} );

		expect( () => registerPDFFonts() ).toThrow( 'register failed' );
	} );
} );
