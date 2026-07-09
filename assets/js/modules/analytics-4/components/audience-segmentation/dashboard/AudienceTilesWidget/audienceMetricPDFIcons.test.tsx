/**
 * Audience metric PDF icon tests.
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
import { scalePDFValue } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import {
	AudienceMetricCitiesIcon,
	AudienceMetricPagesPerVisitIcon,
	AudienceMetricPageviewsIcon,
	AudienceMetricTopContentIcon,
	AudienceMetricVisitorsIcon,
	AudienceMetricVisitsPerVisitorIcon,
} from './audienceMetricPDFIcons';

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

describe( 'audience metric PDF icons', () => {
	it( 'renders at the scaled default size, in the muted variant color', () => {
		const json = renderJSON( <AudienceMetricVisitorsIcon /> );

		expect( json ).toContain( `"width":${ scalePDFValue( 20 ) }` );
		expect( json ).toContain( `"height":${ scalePDFValue( 20 ) }` );
		expect( json ).toContain( PDF_COLORS.SURFACES_ON_SURFACE_VARIANT );
	} );

	it( 'scales the icon to the size the caller sets', () => {
		const json = renderJSON( <AudienceMetricVisitorsIcon size={ 10 } /> );

		expect( json ).toContain( `"width":${ scalePDFValue( 10 ) }` );
	} );

	it( 'draws each metric with its own glyph path', () => {
		const pathStarts = [
			[ AudienceMetricVisitorsIcon, 'M0.833008 16.6668V14.3335C' ],
			[ AudienceMetricVisitsPerVisitorIcon, 'M10 17.5C8.95833' ],
			[ AudienceMetricPagesPerVisitIcon, 'M13.1253 16.6668H3.33366C' ],
			[ AudienceMetricPageviewsIcon, 'M4.16667 17.5C3.70833' ],
			[ AudienceMetricCitiesIcon, 'M10.0003 18.3332C9.80588' ],
			[ AudienceMetricTopContentIcon, 'M3.33366 16.6668C2.87533' ],
		] as const;

		pathStarts.forEach( ( [ Icon, start ] ) => {
			expect( renderJSON( <Icon /> ) ).toContain( start );
		} );
	} );
} );
