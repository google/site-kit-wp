/**
 * DashboardPageSpeedWidgetPDF unit tests.
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
import {
	extractFieldMetrics,
	extractLabMetrics,
} from '@/js/modules/pagespeed-insights/components/common/reportMetrics';
import * as fixtures from '@/js/modules/pagespeed-insights/datastore/__fixtures__';
import type { SpeedPDFData, StrategyData } from './getPDFData';
import DashboardPageSpeedWidgetPDF from './indexPDF';

// Recursively collect every string leaf from a ReactTestRendererJSON tree.
function findTextStrings(
	tree: TestRenderer.ReactTestRendererNode | null | undefined | boolean
): string[] {
	if ( ! tree || typeof tree === 'boolean' ) {
		return [];
	}
	if ( typeof tree === 'string' ) {
		return [ tree ];
	}
	const childResults: string[] = [];
	if ( Array.isArray( tree.children ) ) {
		for ( const child of tree.children ) {
			childResults.push( ...findTextStrings( child ) );
		}
	}
	return childResults;
}

function buildStrategyData( report: object ): StrategyData {
	return {
		lab: extractLabMetrics( report ),
		field: extractFieldMetrics( report ),
	};
}

function buildData( {
	mobileReport = fixtures.pagespeedMobile as object | null,
	desktopReport = fixtures.pagespeedDesktop as object | null,
}: {
	mobileReport?: object | null;
	desktopReport?: object | null;
} = {} ): SpeedPDFData[ 'data' ] {
	return {
		mobile: mobileReport ? buildStrategyData( mobileReport ) : null,
		desktop: desktopReport ? buildStrategyData( desktopReport ) : null,
	};
}

function render( data: SpeedPDFData[ 'data' ] | null ): string {
	const renderer = TestRenderer.create(
		<DashboardPageSpeedWidgetPDF data={ data } />
	);
	const json = renderer.toJSON();
	const root = Array.isArray( json ) ? json[ 0 ] : json;
	return findTextStrings( root ).join( ' ' );
}

describe( 'DashboardPageSpeedWidgetPDF', () => {
	it( 'renders Mobile and Desktop as column headers in each section card', () => {
		const text = render( buildData() );

		expect( text ).toContain( 'Mobile' );
		expect( text ).toContain( 'Desktop' );
	} );

	it( 'renders lab section card with Lab data heading and three metric rows', () => {
		const text = render( buildData() );

		expect( text ).toContain( 'Lab data' );
		// Each metric title appears once per row (row spans both strategies).
		expect( text ).toContain( 'Largest Contentful Paint' );
		expect( text ).toContain( 'Cumulative Layout Shift' );
		expect( text ).toContain( 'Total Blocking Time' );
	} );

	it( 'renders Real user data section when field metrics are available', () => {
		const text = render( buildData() );

		expect( text ).toContain( 'Real user data' );
		expect( text ).toContain( 'Interaction to Next Paint' );
	} );

	it( 'omits Real user data section when extractFieldMetrics returns null', () => {
		const noFieldData: SpeedPDFData[ 'data' ] = {
			mobile: {
				lab: extractLabMetrics( fixtures.pagespeedMobileNoFieldData ),
				field: null,
			},
			desktop: {
				lab: extractLabMetrics( fixtures.pagespeedDesktopNoFieldData ),
				field: null,
			},
		};

		const text = render( noFieldData );

		expect( text ).not.toContain( 'Real user data' );
		expect( text ).not.toContain( 'Interaction to Next Paint' );
	} );

	it( 'renders "—" for a null strategy column while the other strategy still renders', () => {
		const text = render( buildData( { mobileReport: null } ) );

		// Desktop lab metrics still render.
		expect( text ).toContain( 'Total Blocking Time' );
		// Null mobile column shows a dash placeholder, not a Data unavailable notice.
		expect( text ).toContain( '—' );
		expect( text ).not.toContain( 'Data unavailable.' );
	} );

	it( 'renders the whole-widget "Data unavailable." when both strategies are null', () => {
		const text = render( { mobile: null, desktop: null } );

		expect( text ).toContain( 'Data unavailable.' );
		// No section cards are rendered so strategy labels are absent.
		expect( text ).not.toContain( 'Mobile' );
		expect( text ).not.toContain( 'Desktop' );
	} );
} );
