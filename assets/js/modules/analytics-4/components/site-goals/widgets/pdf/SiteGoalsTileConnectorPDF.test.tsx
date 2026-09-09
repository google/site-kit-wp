/**
 * SiteGoalsTileConnectorPDF tests.
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
import { scalePDFValue } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import {
	renderPDFChildStyles,
	renderPDFStyle,
} from '@/js/components/pdf-export/test-utils';
import SiteGoalsTileConnectorPDF from './SiteGoalsTileConnectorPDF';

describe( 'SiteGoalsTileConnectorPDF', () => {
	it( 'breaks the divider line with a round dot near its top', () => {
		const [ lineAboveDot, dot ] = renderPDFChildStyles(
			<SiteGoalsTileConnectorPDF />
		);

		expect( lineAboveDot.width ).toBe( scalePDFValue( 2 ) );
		expect( lineAboveDot.height ).toBe( scalePDFValue( 12 ) );
		expect( dot.width ).toBe( scalePDFValue( 9 ) );
		expect( dot.height ).toBe( scalePDFValue( 9 ) );
		expect( dot.borderRadius ).toBe( scalePDFValue( 4.5 ) );
	} );

	it( 'runs the line below the dot to the end of the column', () => {
		const lineBelowDot = renderPDFChildStyles(
			<SiteGoalsTileConnectorPDF />
		)[ 2 ];

		expect( lineBelowDot.width ).toBe( scalePDFValue( 2 ) );
		expect( lineBelowDot.flex ).toBe( 1 );
	} );

	it( 'sets the gap above and below the divider line', () => {
		const column = renderPDFStyle( <SiteGoalsTileConnectorPDF /> );

		expect( column.marginVertical ).toBe( scalePDFValue( 12 ) );
	} );

	it( 'draws the dot and both line segments in one color', () => {
		renderPDFChildStyles( <SiteGoalsTileConnectorPDF /> ).forEach(
			( shape ) => {
				expect( shape.backgroundColor ).toBe(
					PDF_COLORS.SURFACES_SURFACE_1
				);
			}
		);
	} );
} );
