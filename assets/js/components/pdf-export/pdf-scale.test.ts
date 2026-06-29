/**
 * PDF scale tests.
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
import { PDF_SCALE, createPDFStyles, scalePDFValue } from './pdf-scale';

describe( 'createPDFStyles', () => {
	it( 'scales one length from each scaled property group by PDF_SCALE', () => {
		const styles = createPDFStyles( {
			example: {
				fontSize: 14,
				letterSpacing: 0.5,
				marginTop: 8,
				paddingHorizontal: 12,
				width: 100,
				height: 40,
				top: 6,
				gap: 16,
				borderWidth: 2,
				borderRadius: 16,
				flexBasis: 200,
			},
		} );

		expect( styles.example ).toEqual( {
			fontSize: 14 * PDF_SCALE,
			letterSpacing: 0.5 * PDF_SCALE,
			marginTop: 8 * PDF_SCALE,
			paddingHorizontal: 12 * PDF_SCALE,
			width: 100 * PDF_SCALE,
			height: 40 * PDF_SCALE,
			top: 6 * PDF_SCALE,
			gap: 16 * PDF_SCALE,
			borderWidth: 2 * PDF_SCALE,
			borderRadius: 16 * PDF_SCALE,
			flexBasis: 200 * PDF_SCALE,
		} );
	} );

	it( 'leaves every never-scaled property unchanged', () => {
		const input = {
			example: {
				lineHeight: 1.5,
				fontWeight: 500,
				maxLines: 2,
				flex: 1,
				flexGrow: 1,
				flexShrink: 0,
				aspectRatio: 1.5,
				opacity: 0.5,
				zIndex: 10,
				color: '#161b18',
				fontFamily: 'GoogleSansText',
			},
		} as const;

		const styles = createPDFStyles( input );

		expect( styles.example ).toEqual( input.example );
	} );

	it( 'leaves a percentage length unchanged', () => {
		const styles = createPDFStyles( {
			example: {
				width: '100%',
			},
		} );

		expect( styles.example.width ).toBe( '100%' );
	} );

	it( 'keeps the minus sign on a negative length', () => {
		const styles = createPDFStyles( {
			example: {
				marginTop: -24,
			},
		} );

		expect( styles.example.marginTop ).toBe( -24 * PDF_SCALE );
		expect( styles.example.marginTop ).toBeLessThan( 0 );
	} );
} );

describe( 'scalePDFValue', () => {
	it( 'multiplies a number by PDF_SCALE', () => {
		expect( scalePDFValue( 10 ) ).toBe( 10 * PDF_SCALE );
	} );
} );
