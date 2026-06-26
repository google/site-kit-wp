/**
 * PDFScoredMetricTile unit tests.
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
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { PDF_SCORE_COLORS } from '@/js/components/pdf-export/pdf-theme';
import {
	CATEGORY_AVERAGE,
	CATEGORY_FAST,
	CATEGORY_SLOW,
} from '@/js/modules/pagespeed-insights/util/constants';
import PDFScoredMetricTile from './PDFScoredMetricTile';

function render( props: React.ComponentProps< typeof PDFScoredMetricTile > ) {
	const renderer = TestRenderer.create(
		<PDFScoredMetricTile { ...props } />
	);
	const tree = renderer.toJSON();
	if ( ! tree || Array.isArray( tree ) ) {
		throw new Error( 'Unexpected render output.' );
	}
	return JSON.stringify( tree );
}

describe( 'PDFScoredMetricTile', () => {
	it( 'renders the title, description, and displayValue', () => {
		const json = render( {
			title: 'Largest Contentful Paint',
			description: 'Time it takes for the page to load',
			displayValue: '1.5 s',
			category: CATEGORY_AVERAGE,
		} );

		expect( json ).toContain( 'Largest Contentful Paint' );
		expect( json ).toContain( 'Time it takes for the page to load' );
		expect( json ).toContain( '1.5 s' );
	} );

	it( 'renders a green indicator for CATEGORY_FAST', () => {
		const json = render( {
			title: 'LCP',
			description: 'desc',
			displayValue: '0.5 s',
			category: CATEGORY_FAST,
		} );

		expect( json ).toContain( PDF_SCORE_COLORS.fast );
	} );

	it( 'renders an orange indicator for CATEGORY_AVERAGE', () => {
		const json = render( {
			title: 'LCP',
			description: 'desc',
			displayValue: '2.5 s',
			category: CATEGORY_AVERAGE,
		} );

		expect( json ).toContain( PDF_SCORE_COLORS.average );
	} );

	it( 'renders a red indicator for CATEGORY_SLOW', () => {
		const json = render( {
			title: 'LCP',
			description: 'desc',
			displayValue: '6 s',
			category: CATEGORY_SLOW,
		} );

		expect( json ).toContain( PDF_SCORE_COLORS.slow );
	} );

	it( 'renders distinct colours for all three categories', () => {
		const colors = [ CATEGORY_FAST, CATEGORY_AVERAGE, CATEGORY_SLOW ].map(
			( category ) =>
				render( {
					title: 'M',
					description: 'd',
					displayValue: '0',
					category,
				} )
		);

		// Each serialised tree should contain its own colour but not the others'.
		expect( colors[ 0 ] ).toContain( PDF_SCORE_COLORS.fast );
		expect( colors[ 1 ] ).toContain( PDF_SCORE_COLORS.average );
		expect( colors[ 2 ] ).toContain( PDF_SCORE_COLORS.slow );

		const uniqueColors = new Set( [
			PDF_SCORE_COLORS.fast,
			PDF_SCORE_COLORS.average,
			PDF_SCORE_COLORS.slow,
		] );
		expect( uniqueColors.size ).toBe( 3 );
	} );
} );
