/**
 * Traffic Overview source link tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { act, createTestRegistry, render, screen } from '@tests/js/test-utils';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserInfo,
} from '@tests/js/utils';
import TrafficOverviewSourceLink from './TrafficOverviewSourceLink';

describe( 'TrafficOverviewSourceLink', () => {
	let registry: WPDataRegistry;

	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/settings'
	);

	/**
	 * Renders the source link.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} [viewContext] Optional. The dashboard the link renders on.
	 * @return {Object} The render result.
	 */
	function renderSourceLink( viewContext = VIEW_CONTEXT_MAIN_DASHBOARD ) {
		return render( <TrafficOverviewSourceLink />, {
			registry,
			viewContext,
		} );
	}

	/**
	 * Reads the rendered link's address and decodes it.
	 *
	 * @since n.e.x.t
	 *
	 * @return {string} The decoded address.
	 */
	function getSourceLinkHref() {
		const href = screen
			.getByRole( 'link', {
				name: 'Analytics (opens in a new tab)',
			} )
			.getAttribute( 'href' ) as string;

		// `getServiceReportURL` encodes the report parameters into the Analytics
		// URL. `getAccountChooserURL` then encodes that URL into its `continue`
		// parameter, so the `href` needs decoding twice.
		return decodeURIComponent( decodeURIComponent( href ) );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		provideUserInfo( registry );
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );
	} );

	it( 'links to the Analytics traffic acquisition report for the selected range and the range before it', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '1234567890' );

		const { waitForRegistry } = renderSourceLink();

		await waitForRegistry();

		const href = getSourceLinkHref();

		expect( href ).toContain( '/p1234567890/reports/explorer' );
		expect( href ).toContain( 'r=lifecycle-traffic-acquisition-v2' );
		expect( href ).toContain( 'collectionId=life-cycle' );
		expect( href ).toContain( '_u.date00=20250109' );
		expect( href ).toContain( '_u.date01=20250205' );
		expect( href ).toContain( '_u.date10=20241212' );
		expect( href ).toContain( '_u.date11=20250108' );
	} );

	it( 'filters the link to the entity page path when the site has a current entity', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '1234567890' );

		provideSiteInfo( registry, {
			currentEntityURL: 'https://example.com/about/',
		} );

		const { waitForRegistry } = renderSourceLink();

		await waitForRegistry();

		const href = getSourceLinkHref();

		expect( href ).toContain( 'unifiedPagePathScreen' );
		expect( href ).toContain( '/about/' );
	} );

	it( 'requests no Analytics settings for a view-only user', async () => {
		fetchMock.get( settingsEndpoint, { body: {}, status: 200 } );

		renderSourceLink( VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY );

		await act( async () => {
			await new Promise( ( resolve ) => setTimeout( resolve ) );
		} );

		expect( fetchMock ).not.toHaveFetched( settingsEndpoint );
	} );
} );
