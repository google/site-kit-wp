/**
 * SiteGoalsBreakdownGroupPDF tests.
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
import { PERCENT_FORMAT } from '@/js/modules/analytics-4/components/site-goals/utils/formats';
import { numFmt } from '@/js/util';
import { OTHER_SOURCES_GROUP_ID } from './shapeSiteGoalsPDFData';
import SiteGoalsBreakdownGroupPDF from './SiteGoalsBreakdownGroupPDF';

function findTextStrings( tree: TestRenderer.ReactTestRendererJSON ): string[] {
	const textOutput: string[] = [];

	function visit(
		node:
			| string
			| number
			| TestRenderer.ReactTestRendererJSON
			| null
			| undefined
	) {
		if ( node === null || node === undefined ) {
			return;
		}
		if ( typeof node === 'string' ) {
			textOutput.push( node );
			return;
		}
		if ( typeof node === 'number' ) {
			textOutput.push( String( node ) );
			return;
		}
		const children = node.children;
		if ( Array.isArray( children ) ) {
			children.forEach( visit );
		}
	}

	visit( tree );
	return textOutput;
}

function renderGroup(
	props: ComponentProps< typeof SiteGoalsBreakdownGroupPDF >
): string[] {
	const renderer = TestRenderer.create(
		<SiteGoalsBreakdownGroupPDF { ...props } />
	);
	const tree = renderer.toJSON();
	if ( ! tree || Array.isArray( tree ) ) {
		throw new Error( 'Unexpected render output.' );
	}
	return findTextStrings( tree );
}

describe( 'SiteGoalsBreakdownGroupPDF', () => {
	const FULL_GROUP = {
		id: 'woocommerce',
		label: 'WooCommerce',
		total: { current: 120, previous: 100 },
		rate: { current: 0.5, previous: 0.4 },
		engagementRate: { current: 0.75, previous: 0.7 },
		sessions: { current: 1000, previous: 900 },
	};

	const OTHER_SOURCES_GROUP = {
		id: OTHER_SOURCES_GROUP_ID,
		label: 'Other sources',
		total: { current: 30, previous: 20 },
	};

	it( 'renders the group heading and every tile for a full breakdown group', () => {
		const text = renderGroup( {
			group: FULL_GROUP,
			rateLabel: 'Sales rate',
			totalLabel: 'Total sales',
		} ).join( ' ' );

		expect( text ).toContain( 'WooCommerce' );
		expect( text ).toContain( 'Sales rate' );
		expect( text ).toContain( 'Total sales' );
		expect( text ).toContain( 'Engagement rate' );
		expect( text ).toContain(
			numFmt( FULL_GROUP.rate.current, PERCENT_FORMAT )
		);
		expect( text ).toContain( numFmt( FULL_GROUP.total.current ) );
		expect( text ).toContain(
			numFmt( FULL_GROUP.engagementRate.current, PERCENT_FORMAT )
		);
	} );

	it( 'hides the group heading when showLabel is false', () => {
		const text = renderGroup( {
			group: FULL_GROUP,
			rateLabel: 'Sales rate',
			totalLabel: 'Total sales',
			showLabel: false,
		} ).join( ' ' );

		expect( text ).not.toContain( 'WooCommerce' );
	} );

	it( 'renders only the total tile for the "Other sources" group', () => {
		const text = renderGroup( {
			group: OTHER_SOURCES_GROUP,
			rateLabel: 'Sales rate',
			totalLabel: 'Total sales',
		} ).join( ' ' );

		expect( text ).toContain( 'Total sales' );
		expect( text ).toContain( numFmt( OTHER_SOURCES_GROUP.total.current ) );
		expect( text ).not.toContain( 'Sales rate' );
		expect( text ).not.toContain( 'Engagement rate' );
	} );

	it( 'renders the total subtitle and the sessions caption under the rate and engagement tiles', () => {
		const text = renderGroup( {
			group: FULL_GROUP,
			rateLabel: 'Sales rate',
			totalLabel: 'Total sales',
			totalSubtitle: '"purchase" events',
		} );

		expect( text ).toContain( '"purchase" events' );
		const sessionsCaption = `of ${ numFmt(
			FULL_GROUP.sessions.current
		) } total sessions`;
		// Rendered once under the rate tile and once under the engagement tile.
		expect(
			text.filter( ( entry ) => entry === sessionsCaption ).length
		).toBe( 2 );
	} );

	it( 'renders the comparison label as the change caption for tiles with a change', () => {
		const text = renderGroup( {
			group: FULL_GROUP,
			rateLabel: 'Sales rate',
			totalLabel: 'Total sales',
			comparisonLabel: 'Vs. prev. 28 days',
		} );

		expect(
			text.filter( ( entry ) => entry === 'Vs. prev. 28 days' ).length
		).toBeGreaterThan( 0 );
	} );
} );
