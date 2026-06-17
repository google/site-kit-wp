/**
 * Site Goals Selection Panel Content tests.
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import { setItem } from '@/js/googlesitekit/api/cache';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { SITE_GOALS_BREAKDOWN_NOTICE } from '@/js/modules/analytics-4/components/site-goals/constants';
import { AVAILABILITY_SYNC_CACHE_KEY } from '@/js/modules/analytics-4/components/site-goals/notifications/BreakdownNoticeArea';
import { SITE_GOALS_INTRO_MODAL_BANNER } from '@/js/modules/analytics-4/components/site-goals/notifications/IntroModalBanner';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { mockBrowserScrolling } from '@tests/js/mock-browser-utils';
import { fireEvent, render, waitFor } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
} from '@tests/js/utils';
import PanelContent from './PanelContent';

describe( 'PanelContent', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	const ECOMMERCE_NOTICE_TITLE =
		'Using both WooCommerce and Easy Digital Downloads to sell products or services?';
	const LEAD_NOTICE_TITLE = 'Want to see results for each form?';
	const BOTH_NOTICE_TITLE =
		'Have multiple forms, or Using both WooCommerce and Easy Digital Downloads for your site?';

	mockBrowserScrolling();

	beforeEach( async () => {
		registry = createTestRegistry();
		// Mark the breakdown notice's throttled availability sync as already done,
		// so it doesn't schedule a background sync during these tests.
		await setItem( AVAILABILITY_SYNC_CACHE_KEY, true );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		// Both ecommerce plugins active, so the "both plugins" notice copy shows.
		provideSiteInfo( registry, {
			hasMultipleActiveEcommerceEventProviders: true,
		} );
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, connected: true },
		] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { availableCustomDimensions: [] } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.ADD_TO_CART,
				ENUM_CONVERSION_EVENTS.CONTACT,
			] );
		// Aggregated state with the notice eligible to show.
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ SITE_GOALS_INTRO_MODAL_BANNER ] );
	} );

	it( 'renders a single combined breakdown notice above the sections', () => {
		const { getByText, queryByText, getAllByText } = render(
			<PanelContent hasEcommerceGoalDrivers hasLeadGoalDrivers />,
			{ registry }
		);

		// Both dimensions are missing, so a single combined "both" notice shows
		// (not one per section).
		expect( getByText( BOTH_NOTICE_TITLE ) ).toBeInTheDocument();
		expect( queryByText( ECOMMERCE_NOTICE_TITLE ) ).not.toBeInTheDocument();
		expect( queryByText( LEAD_NOTICE_TITLE ) ).not.toBeInTheDocument();
		expect( getAllByText( 'No thanks' ) ).toHaveLength( 1 );
	} );

	it( 'scopes the combined notice to ecommerce when only ecommerce is active', () => {
		const { getByText, queryByText } = render(
			<PanelContent
				hasLeadGoalDrivers={ false }
				hasEcommerceGoalDrivers
			/>,
			{ registry }
		);

		expect( getByText( ECOMMERCE_NOTICE_TITLE ) ).toBeInTheDocument();
		expect( queryByText( LEAD_NOTICE_TITLE ) ).not.toBeInTheDocument();
		expect( queryByText( BOTH_NOTICE_TITLE ) ).not.toBeInTheDocument();
	} );

	it( 'scopes the combined notice to lead when only lead is active', () => {
		const { getByText, queryByText } = render(
			<PanelContent
				hasEcommerceGoalDrivers={ false }
				hasLeadGoalDrivers
			/>,
			{ registry }
		);

		expect( getByText( LEAD_NOTICE_TITLE ) ).toBeInTheDocument();
		expect( queryByText( ECOMMERCE_NOTICE_TITLE ) ).not.toBeInTheDocument();
		expect( queryByText( BOTH_NOTICE_TITLE ) ).not.toBeInTheDocument();
	} );

	it( 'dismisses the combined notice via the shared slug', async () => {
		fetchMock.postOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
			{ body: [ SITE_GOALS_BREAKDOWN_NOTICE ], status: 200 }
		);

		const { getAllByText, queryByText } = render(
			<PanelContent hasEcommerceGoalDrivers hasLeadGoalDrivers />,
			{ registry }
		);

		// A single combined notice means a single "No thanks".
		const dismissButtons = getAllByText( 'No thanks' );
		expect( dismissButtons ).toHaveLength( 1 );

		fireEvent.click( dismissButtons[ 0 ] );

		await waitFor( () => {
			expect(
				registry
					.select( CORE_USER )
					.isItemDismissed( SITE_GOALS_BREAKDOWN_NOTICE )
			).toBe( true );
		} );

		expect( queryByText( BOTH_NOTICE_TITLE ) ).not.toBeInTheDocument();
	} );
} );
