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
import { renderPDFText } from '@/js/components/pdf-export/test-utils';
import { EcommerceKeyActionEvent } from '@/js/modules/analytics-4/components/site-goals/utils/keyActionText';
import OnlineStorePerformanceWidgetPDF from './OnlineStorePerformanceWidgetPDF';
import { ONLINE_STORE_PDF_GROUPS } from './pdf/__fixtures__';

/**
 * Renders the Online store performance PDF section and reads the text it holds.
 *
 * @since n.e.x.t
 *
 * @param {string} primaryEvent The ecommerce event the Key action tiles count.
 * @return {string} The text the Online store performance section renders, joined in render order.
 */
function renderOnlineStoreSectionText(
	primaryEvent: EcommerceKeyActionEvent
): string {
	return renderPDFText(
		<OnlineStorePerformanceWidgetPDF
			data={ {
				groups: ONLINE_STORE_PDF_GROUPS,
				dateRangeLength: 28,
				primaryEvent,
			} }
		/>
	).join( ' ' );
}

describe( 'OnlineStorePerformanceWidgetPDF', () => {
	it( 'titles the tiles "Sales rate" and "Total sales" when the primary event is "purchase"', () => {
		const text = renderOnlineStoreSectionText( 'purchase' );

		expect( text ).toContain( 'Online store performance' );
		expect( text ).toContain( 'WooCommerce' );
		expect( text ).toContain( 'Sales rate' );
		expect( text ).toContain( 'Total sales' );
		expect( text ).toContain( '“purchase” events' );
	} );

	it( 'titles the tiles "Add to cart rate" and "Products added to cart" when the primary event is "add_to_cart"', () => {
		const text = renderOnlineStoreSectionText( 'add_to_cart' );

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
