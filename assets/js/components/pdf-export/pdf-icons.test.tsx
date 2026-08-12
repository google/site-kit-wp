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
 * Internal dependencies
 */
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';
import {
	LOGO_G_ASPECT_RATIO,
	PDFAudienceMetricIconCities,
	PDFAudienceMetricIconPagesPerVisit,
	PDFAudienceMetricIconPageviews,
	PDFAudienceMetricIconTopContent,
	PDFAudienceMetricIconVisitors,
	PDFAudienceMetricIconVisitsPerVisitor,
	PDFChevronRight,
	PDFLogoG,
	PDFNavContentIcon,
	PDFNavKeyMetricsIcon,
	PDFNavMonetizationIcon,
	PDFNavSpeedIcon,
	PDFNavTrafficIcon,
	PDFStarFill,
	SECTION_ICONS,
} from './pdf-icons';
import { scalePDFValue } from './pdf-scale';
import { PDF_COLORS } from './pdf-theme';
import { renderJSON } from './test-utils';

const ALL_ICONS = [
	[ 'visitors', PDFAudienceMetricIconVisitors ],
	[ 'visits per visitor', PDFAudienceMetricIconVisitsPerVisitor ],
	[ 'pages per visit', PDFAudienceMetricIconPagesPerVisit ],
	[ 'pageviews', PDFAudienceMetricIconPageviews ],
	[ 'cities', PDFAudienceMetricIconCities ],
	[ 'top content', PDFAudienceMetricIconTopContent ],
	[ 'key metrics section', PDFNavKeyMetricsIcon ],
	[ 'traffic section', PDFNavTrafficIcon ],
	[ 'content section', PDFNavContentIcon ],
	[ 'speed section', PDFNavSpeedIcon ],
	[ 'monetization section', PDFNavMonetizationIcon ],
	[ 'filled star', PDFStarFill ],
	[ 'right-facing chevron', PDFChevronRight ],
] as const;

const ICON_DEFAULT_COLORS = [
	[
		'key metrics section',
		PDFNavKeyMetricsIcon,
		PDF_COLORS.SURFACES_ON_SURFACE,
	],
	[ 'traffic section', PDFNavTrafficIcon, PDF_COLORS.SURFACES_ON_SURFACE ],
	[ 'content section', PDFNavContentIcon, PDF_COLORS.SURFACES_ON_SURFACE ],
	[ 'speed section', PDFNavSpeedIcon, PDF_COLORS.SURFACES_ON_SURFACE ],
	[
		'monetization section',
		PDFNavMonetizationIcon,
		PDF_COLORS.SURFACES_ON_SURFACE,
	],
	[ 'filled star', PDFStarFill, PDF_COLORS.VIOLET_V_600 ],
	[ 'right-facing chevron', PDFChevronRight, PDF_COLORS.CONTENT_SECONDARY ],
] as const;

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

	it( 'draws the Google "G" logo from its image file at its own width and height', () => {
		const json = renderJSON( <PDFLogoG /> );

		// Jest replaces every image import with `tests/js/fileMock.js`. The icon's
		// `src` is the string that file exports.
		expect( json ).toContain( 'test-file-stub' );
		expect( json ).toContain(
			`"width":${ scalePDFValue( 20 * LOGO_G_ASPECT_RATIO ) }`
		);
		expect( json ).toContain( `"height":${ scalePDFValue( 20 ) }` );
	} );

	it( 'draws the Google "G" logo at the size prop it gets', () => {
		const json = renderJSON( <PDFLogoG size={ 24 } /> );

		expect( json ).toContain(
			`"width":${ scalePDFValue( 24 * LOGO_G_ASPECT_RATIO ) }`
		);
		expect( json ).toContain( `"height":${ scalePDFValue( 24 ) }` );
	} );

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

	it.each( ICON_DEFAULT_COLORS )(
		'draws the %s icon in its default color',
		( _name, Icon, color ) => {
			expect( renderJSON( <Icon /> ) ).toContain( color );
		}
	);

	it( 'maps each main-dashboard section to its icon', () => {
		expect( SECTION_ICONS ).toEqual( {
			[ CONTEXT_MAIN_DASHBOARD_KEY_METRICS ]: PDFNavKeyMetricsIcon,
			[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ]: PDFNavTrafficIcon,
			[ CONTEXT_MAIN_DASHBOARD_CONTENT ]: PDFNavContentIcon,
			[ CONTEXT_MAIN_DASHBOARD_SPEED ]: PDFNavSpeedIcon,
			[ CONTEXT_MAIN_DASHBOARD_MONETIZATION ]: PDFNavMonetizationIcon,
		} );
	} );
} );
