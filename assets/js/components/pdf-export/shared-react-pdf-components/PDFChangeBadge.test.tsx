/**
 * PDFChangeBadge tests.
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
import { ComponentProps } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { PDF_SCALE } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFChangeBadge from './PDFChangeBadge';

/**
 * Renders the badge and returns the rendered tree as a JSON string.
 *
 * @since 1.183.0
 *
 * @param props Props for the badge.
 * @return JSON string of the rendered tree.
 */
function renderBadge( props: ComponentProps< typeof PDFChangeBadge > ): string {
	return JSON.stringify(
		TestRenderer.create( <PDFChangeBadge { ...props } /> ).toJSON()
	);
}

describe( 'PDFChangeBadge', () => {
	it( 'uses the positive colors for a rising change', () => {
		const badgeJSON = renderBadge( { change: '+5.1%' } );

		expect( badgeJSON ).toContain( '+5.1%' );
		expect( badgeJSON ).toContain( PDF_COLORS.GREEN_G_50 );
		expect( badgeJSON ).toContain(
			PDF_COLORS.UTILITY_ON_SUCCESS_CONTAINER
		);
		expect( badgeJSON ).not.toContain( PDF_COLORS.UTILITY_ERROR_CONTAINER );
	} );

	it( 'uses the negative colors for a falling change', () => {
		const badgeJSON = renderBadge( {
			change: '-5.0%',
			changeType: 'negative',
		} );

		expect( badgeJSON ).toContain( '-5.0%' );
		expect( badgeJSON ).toContain( PDF_COLORS.UTILITY_ERROR_CONTAINER );
		expect( badgeJSON ).toContain( PDF_COLORS.UTILITY_ON_ERROR_CONTAINER );
		expect( badgeJSON ).not.toContain( PDF_COLORS.GREEN_G_50 );
	} );

	it( 'uses the neutral colors for a zero change', () => {
		const badgeJSON = renderBadge( {
			change: '0%',
			changeType: 'noChange',
		} );

		expect( badgeJSON ).toContain( '0%' );
		expect( badgeJSON ).toContain( PDF_COLORS.SURFACES_INVERSE_ON_SURFACE );
		expect( badgeJSON ).toContain( PDF_COLORS.NEUTRAL_N_700 );
		expect( badgeJSON ).not.toContain( PDF_COLORS.GREEN_G_50 );
		expect( badgeJSON ).not.toContain( PDF_COLORS.UTILITY_ERROR_CONTAINER );
	} );

	it( 'scales the badge radius and padding', () => {
		const badgeJSON = renderBadge( { change: '+5.1%' } );

		expect( badgeJSON ).toContain( `"borderRadius":${ 100 * PDF_SCALE }` );
		expect( badgeJSON ).toContain( `"paddingVertical":${ 4 * PDF_SCALE }` );
		expect( badgeJSON ).toContain(
			`"paddingHorizontal":${ 8 * PDF_SCALE }`
		);
	} );
} );
