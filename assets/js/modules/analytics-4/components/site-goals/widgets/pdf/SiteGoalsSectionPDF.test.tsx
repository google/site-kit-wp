/**
 * SiteGoalsSectionPDF tests.
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
import { renderPDFText } from '@/js/components/pdf-export/test-utils';
import {
	AGGREGATED_GROUP_ID,
	SiteGoalsPDFGroup,
} from './shapeSiteGoalsPDFData';
import SiteGoalsSectionPDF from './SiteGoalsSectionPDF';

/**
 * Builds a Site Goals PDF breakdown group that fills every tile.
 *
 * @since n.e.x.t
 *
 * @param {string} id    The breakdown group ID.
 * @param {string} label The breakdown group heading.
 * @return {Object} The Site Goals PDF breakdown group.
 */
function buildSiteGoalsPDFGroup(
	id: string,
	label: string
): SiteGoalsPDFGroup {
	return {
		id,
		label,
		total: { current: 120, previous: 100 },
		rate: { current: 0.5, previous: 0.4 },
		engagementRate: { current: 0.75, previous: 0.7 },
		sessions: { current: 1000, previous: 900 },
	};
}

/**
 * Builds the Site Goals PDF section for a set of breakdown groups.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} groups The breakdown groups the Site Goals PDF section renders.
 * @return {Object} The Site Goals PDF section element.
 */
function buildSiteGoalsSection( groups: SiteGoalsPDFGroup[] ) {
	return (
		<SiteGoalsSectionPDF
			heading="Online store performance"
			groups={ groups }
			rateLabel="Sales rate"
			totalLabel="Total sales"
			totalSubtitle="“purchase” events"
			dateRangeLength={ 28 }
		/>
	);
}

describe( 'SiteGoalsSectionPDF', () => {
	it( 'shows the Site Goals section heading above one card per breakdown group', () => {
		const text = renderPDFText(
			buildSiteGoalsSection( [
				buildSiteGoalsPDFGroup( 'woocommerce', 'WooCommerce' ),
				buildSiteGoalsPDFGroup(
					'easy-digital-downloads',
					'Easy Digital Downloads'
				),
			] )
		).join( ' ' );

		expect( text ).toContain( 'Online store performance' );
		expect( text ).toContain( 'WooCommerce' );
		expect( text ).toContain( 'Easy Digital Downloads' );
		expect( text ).toContain( 'Sales rate' );
	} );

	it( "builds the comparison caption from the number of days in the PDF report's date range", () => {
		const text = renderPDFText(
			buildSiteGoalsSection( [
				buildSiteGoalsPDFGroup( 'woocommerce', 'WooCommerce' ),
			] )
		);

		expect( text ).toContain( 'Vs. prev. 28 days' );
	} );

	it( 'shows no group heading for the single group that covers the whole site', () => {
		const text = renderPDFText(
			buildSiteGoalsSection( [
				buildSiteGoalsPDFGroup(
					AGGREGATED_GROUP_ID,
					'Online store performance'
				),
			] )
		);

		// The heading appears once, from the section. The group adds no
		// heading of its own.
		expect(
			text.filter( ( entry ) => entry === 'Online store performance' )
				.length
		).toBe( 1 );
	} );

	it( 'renders nothing when there is no breakdown group', () => {
		expect(
			TestRenderer.create( buildSiteGoalsSection( [] ) ).toJSON()
		).toBeNull();
	} );
} );
