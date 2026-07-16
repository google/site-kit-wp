/**
 * PDF icon tests.
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
import { ReactElement } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import {
	PDFAudienceMetricIconCities,
	PDFAudienceMetricIconPagesPerVisit,
	PDFAudienceMetricIconPageviews,
	PDFAudienceMetricIconTopContent,
	PDFAudienceMetricIconVisitors,
	PDFAudienceMetricIconVisitsPerVisitor,
} from './pdf-icons';
import { scalePDFValue } from './pdf-scale';
import { PDF_COLORS } from './pdf-theme';

const ALL_ICONS = [
	[ 'visitors', PDFAudienceMetricIconVisitors ],
	[ 'visits per visitor', PDFAudienceMetricIconVisitsPerVisitor ],
	[ 'pages per visit', PDFAudienceMetricIconPagesPerVisit ],
	[ 'pageviews', PDFAudienceMetricIconPageviews ],
	[ 'cities', PDFAudienceMetricIconCities ],
	[ 'top content', PDFAudienceMetricIconTopContent ],
] as const;

/**
 * Renders a PDF element to its JSON tree string.
 *
 * @since n.e.x.t
 *
 * @param element The element to render.
 * @return The rendered tree as a string.
 */
function renderJSON( element: ReactElement ) {
	return JSON.stringify( TestRenderer.create( element ).toJSON() );
}

describe( 'PDF icons', () => {
	it.each( ALL_ICONS )(
		'draws the %s icon from its source SVG file',
		( _name, Icon ) => {
			// Each icon imports its source file with `?pdf`, and every `?pdf`
			// import resolves through the same mock, so every icon draws the
			// mock's placeholder path.
			expect( renderJSON( <Icon /> ) ).toContain(
				'M 0 0 L 20 0 L 20 20 L 0 20 Z'
			);
		}
	);

	it( 'renders at the scaled default size, in the muted variant color', () => {
		const json = renderJSON( <PDFAudienceMetricIconVisitors /> );

		expect( json ).toContain( `"width":${ scalePDFValue( 20 ) }` );
		expect( json ).toContain( `"height":${ scalePDFValue( 20 ) }` );
		expect( json ).toContain( PDF_COLORS.SURFACES_ON_SURFACE_VARIANT );
	} );

	it( 'scales the icon to the size the caller sets', () => {
		const json = renderJSON(
			<PDFAudienceMetricIconVisitors size={ 10 } />
		);

		expect( json ).toContain( `"width":${ scalePDFValue( 10 ) }` );
	} );

	it( 'draws the icon in the color the caller sets', () => {
		const json = renderJSON(
			<PDFAudienceMetricIconVisitors color={ PDF_COLORS.GREEN_G_50 } />
		);

		expect( json ).toContain( PDF_COLORS.GREEN_G_50 );
	} );
} );
