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
import { PDF_FONT_FAMILY_DISPLAY, PDF_FONT_FAMILY_TEXT } from './pdf-theme';

// `@react-pdf/renderer` is auto-mocked via `__mocks__/@react-pdf/renderer.js`.
// The module under test holds a session-scoped registration latch, so each test
// reloads it (and the mocked renderer) with `jest.resetModules()`.
async function setup() {
	const { Font } = await import( '@react-pdf/renderer' );
	const { registerPDFFonts } = await import( './pdf-fonts-react' );
	return { Font, registerPDFFonts };
}

// The bundled (multi-weight) shape we always register with; narrows the
// `SingleLoad | BulkLoad` union the typings expose for `Font.register`.
type FontConfig = {
	family: string;
	fonts: Array< { src: string; fontWeight: number } >;
};

describe( 'registerPDFFonts', () => {
	beforeEach( () => {
		jest.resetModules();
		jest.clearAllMocks();
	} );

	it( 'registers both families with the bundled weights and returns the display family', async () => {
		const { Font, registerPDFFonts } = await setup();

		const family = registerPDFFonts();

		expect( family ).toBe( PDF_FONT_FAMILY_DISPLAY );
		expect( Font.register ).toHaveBeenCalledTimes( 2 );

		const calls = jest.mocked( Font.register ).mock.calls as Array<
			[ FontConfig ]
		>;
		const displayConfig = calls.find(
			( [ config ] ) => config.family === PDF_FONT_FAMILY_DISPLAY
		)?.[ 0 ];
		const textConfig = calls.find(
			( [ config ] ) => config.family === PDF_FONT_FAMILY_TEXT
		)?.[ 0 ];

		expect( displayConfig?.fonts.map( ( f ) => f.fontWeight ) ).toEqual( [
			400,
		] );
		expect( textConfig?.fonts.map( ( f ) => f.fontWeight ) ).toEqual( [
			400, 500,
		] );
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

		expect( sources ).toHaveLength( 3 );
		sources.forEach( ( src ) => {
			expect( typeof src ).toBe( 'string' );
			expect( src.startsWith( 'data:' ) ).toBe( false );
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
