/**
 * OnlineStorePerformanceWidgetPDF tests.
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
import { findTextStrings } from '@/js/components/pdf-export/test-utils';
import { EcommerceKeyActionEvent } from '@/js/modules/analytics-4/components/site-goals/utils/keyActionText';
import { OnlineStorePerformancePDFData } from './getOnlineStorePerformancePDFData';
import OnlineStorePerformanceWidgetPDF from './OnlineStorePerformanceWidgetPDF';

const ONLINE_STORE_GROUPS = [
	{
		id: 'woocommerce',
		label: 'WooCommerce',
		total: { current: 85, previous: 76 },
		rate: { current: 0.025, previous: 0.02 },
		engagementRate: { current: 0.36, previous: 0.39 },
		sessions: { current: 3400, previous: 3800 },
	},
];

/**
 * Renders the Online store performance PDF section and reads the text it holds.
 *
 * @since n.e.x.t
 *
 * @param {Object} data The loaded Online store performance section data, or `null` when its loader returned none.
 * @return {Array<string>} The text strings the Online store performance section renders, in order.
 */
function renderOnlineStoreSectionText(
	data: OnlineStorePerformancePDFData[ 'data' ]
) {
	const tree = TestRenderer.create(
		<OnlineStorePerformanceWidgetPDF data={ data } />
	).toJSON();

	if ( ! tree || Array.isArray( tree ) ) {
		return [];
	}

	return findTextStrings( tree );
}

/**
 * Builds the Online store performance section data for one ecommerce event.
 *
 * @since n.e.x.t
 *
 * @param {string} primaryEvent The ecommerce event the Key action tiles count.
 * @return {Object} The Online store performance section data.
 */
function buildOnlineStoreSectionData( primaryEvent: EcommerceKeyActionEvent ) {
	return { groups: ONLINE_STORE_GROUPS, dateRangeLength: 28, primaryEvent };
}

describe( 'OnlineStorePerformanceWidgetPDF', () => {
	it( 'names the sales tiles when the primary event is "purchase"', () => {
		const text = renderOnlineStoreSectionText(
			buildOnlineStoreSectionData( 'purchase' )
		).join( ' ' );

		expect( text ).toContain( 'Online store performance' );
		expect( text ).toContain( 'WooCommerce' );
		expect( text ).toContain( 'Sales rate' );
		expect( text ).toContain( 'Total sales' );
		expect( text ).toContain( '“purchase” events' );
	} );

	it( 'names the cart tiles when the primary event is "add_to_cart"', () => {
		const text = renderOnlineStoreSectionText(
			buildOnlineStoreSectionData( 'add_to_cart' )
		).join( ' ' );

		expect( text ).toContain( 'Add to cart rate' );
		expect( text ).toContain( 'Products added to cart' );
		expect( text ).toContain( '“add_to_cart” events' );
		expect( text ).not.toContain( 'Sales rate' );
	} );

	it( 'renders nothing when the Online store loader returns no data', () => {
		expect(
			TestRenderer.create(
				<OnlineStorePerformanceWidgetPDF data={ null } />
			).toJSON()
		).toBeNull();
	} );
} );
