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

/**
 * Internal dependencies
 */
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import {
	renderJSON,
	renderPDFText,
} from '@/js/components/pdf-export/test-utils';
import { PERCENT_FORMAT } from '@/js/modules/analytics-4/components/site-goals/utils/formats';
import { numFmt } from '@/js/util';
import { OTHER_SOURCES_GROUP_ID } from './shapeSiteGoalsPDFData';
import SiteGoalsBreakdownGroupPDF from './SiteGoalsBreakdownGroupPDF';

/**
 * Renders the Site Goals breakdown group and reads the text it holds.
 *
 * @since n.e.x.t
 *
 * @param {Object} props The props to render the Site Goals breakdown group with.
 * @return {Array<string>} The text strings the Site Goals breakdown group renders, in order.
 */
function renderBreakdownGroupText(
	props: ComponentProps< typeof SiteGoalsBreakdownGroupPDF >
): string[] {
	return renderPDFText( <SiteGoalsBreakdownGroupPDF { ...props } /> );
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
		const text = renderBreakdownGroupText( {
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
		const text = renderBreakdownGroupText( {
			group: FULL_GROUP,
			rateLabel: 'Sales rate',
			totalLabel: 'Total sales',
			showLabel: false,
		} ).join( ' ' );

		expect( text ).not.toContain( 'WooCommerce' );
	} );

	it( 'renders only the total tile for the "Other sources" group', () => {
		const text = renderBreakdownGroupText( {
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
		const text = renderBreakdownGroupText( {
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

	it( 'gives the rate tile a green background when the rate rises and a red one when it falls', () => {
		const risingRateJSON = renderJSON(
			<SiteGoalsBreakdownGroupPDF
				group={ FULL_GROUP }
				rateLabel="Sales rate"
				totalLabel="Total sales"
			/>
		);
		const fallingRateJSON = renderJSON(
			<SiteGoalsBreakdownGroupPDF
				group={ {
					...FULL_GROUP,
					rate: { current: 0.4, previous: 0.5 },
				} }
				rateLabel="Sales rate"
				totalLabel="Total sales"
			/>
		);

		expect( risingRateJSON ).toContain( PDF_COLORS.GREEN_G_10 );
		expect( fallingRateJSON ).toContain( PDF_COLORS.RED_R_10 );
	} );

	it( 'gives the rate tile a neutral background when the rate does not change', () => {
		const noChangeRateJSON = renderJSON(
			<SiteGoalsBreakdownGroupPDF
				group={ {
					...FULL_GROUP,
					rate: { current: 0.5, previous: 0.5 },
				} }
				rateLabel="Sales rate"
				totalLabel="Total sales"
			/>
		);

		expect( noChangeRateJSON ).toContain( PDF_COLORS.NEUTRAL_N_10 );
	} );

	it( 'gives the rate tile a green background when the rate rises from zero', () => {
		const zeroPreviousRateJSON = renderJSON(
			<SiteGoalsBreakdownGroupPDF
				group={ { ...FULL_GROUP, rate: { current: 0.5, previous: 0 } } }
				rateLabel="Sales rate"
				totalLabel="Total sales"
			/>
		);

		expect( zeroPreviousRateJSON ).toContain( PDF_COLORS.GREEN_G_10 );
	} );

	it( 'gives the rate tile no background color when the rate is zero in both periods', () => {
		const zeroRateJSON = renderJSON(
			<SiteGoalsBreakdownGroupPDF
				group={ { ...FULL_GROUP, rate: { current: 0, previous: 0 } } }
				rateLabel="Sales rate"
				totalLabel="Total sales"
			/>
		);

		expect( zeroRateJSON ).not.toContain( PDF_COLORS.GREEN_G_10 );
		expect( zeroRateJSON ).not.toContain( PDF_COLORS.RED_R_10 );
		expect( zeroRateJSON ).not.toContain( PDF_COLORS.NEUTRAL_N_10 );
	} );

	it( 'hides the change caption on a tile with no change badge', () => {
		const text = renderBreakdownGroupText( {
			group: {
				id: 'woocommerce',
				label: 'WooCommerce',
				total: { current: 12, previous: 0 },
				rate: { current: 0.5, previous: 0 },
				engagementRate: { current: 0.75, previous: 0 },
				sessions: { current: 24, previous: 0 },
			},
			rateLabel: 'Sales rate',
			totalLabel: 'Total sales',
			comparisonLabel: 'Vs. prev. 28 days',
		} );

		// Every metric has a previous value of zero, so no tile shows a change
		// badge.
		expect( text ).not.toContain( 'Vs. prev. 28 days' );
	} );

	it( 'hides the change badge and the caption on a tile whose metric is zero in both periods', () => {
		const text = renderBreakdownGroupText( {
			group: {
				id: 'woocommerce',
				label: 'WooCommerce',
				total: { current: 0, previous: 0 },
			},
			rateLabel: 'Sales rate',
			totalLabel: 'Total sales',
			comparisonLabel: 'Vs. prev. 28 days',
		} );

		// The group has only the total, so a `0%` in the text can only come
		// from a change badge.
		expect( text ).not.toContain( '0%' );
		expect( text ).not.toContain( 'Vs. prev. 28 days' );
	} );

	it( 'renders the comparison label as the change caption for tiles with a change', () => {
		const text = renderBreakdownGroupText( {
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
