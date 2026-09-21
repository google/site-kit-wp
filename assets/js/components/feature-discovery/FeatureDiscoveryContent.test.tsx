/**
 * Feature Discovery routed content tests.
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
import { createMemoryHistory } from 'history';

/**
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	dismissItemEndpoint,
	dismissedItemsEndpoint,
} from '@tests/js/mock-dismiss-item-endpoints';
import {
	act,
	createTestRegistry,
	freezeFetch,
	muteFetch,
	render,
} from '@tests/js/test-utils';
import {
	FEATURE_DISCOVERY_VISITED_ITEM_SLUG,
	HUB_LAUNCH_VERSION,
} from './constants';
import FeatureDiscoveryContent from './FeatureDiscoveryContent';

const ALL_SERVICES_PLACEHOLDER =
	'Feature Discovery Hub tab panel placeholder: All services and features';
const WHATS_NEW_SELECTOR = '.googlesitekit-whats-new';

describe( 'FeatureDiscoveryContent', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		// The What’s new? tab reads the user's newness state; expirable
		// items are seeded so it resolves without an unrelated fetch, and
		// the initial version defaults to a value tests override as needed.
		// Dismissed items are left for each describe/test to seed, since the
		// routing tests below need to control that state precisely.
		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.186.0' );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
	} );

	function renderContent( route: string, history = createMemoryHistory() ) {
		return render( <FeatureDiscoveryContent />, {
			registry,
			route,
			history,
		} );
	}

	describe( 'explicit tab routes', () => {
		beforeEach( () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					FEATURE_DISCOVERY_VISITED_ITEM_SLUG,
				] );
		} );

		it( 'should render only the tab panel content for /all-services', async () => {
			const { container, getByText, waitForRegistry } =
				renderContent( '/all-services' );

			await waitForRegistry();

			expect( getByText( ALL_SERVICES_PLACEHOLDER ) ).toBeInTheDocument();
			expect(
				container.querySelector( WHATS_NEW_SELECTOR )
			).not.toBeInTheDocument();
		} );

		it( 'should render only the tab panel content for /whats-new', async () => {
			const { container, queryByText, waitForRegistry } =
				renderContent( '/whats-new' );

			await waitForRegistry();

			expect(
				container.querySelector( WHATS_NEW_SELECTOR )
			).toBeInTheDocument();
			expect(
				queryByText( ALL_SERVICES_PLACEHOLDER )
			).not.toBeInTheDocument();
		} );

		it( 'should render an explicit tab immediately without waiting for the routing state to resolve', async () => {
			const { getByText, waitForRegistry } =
				renderContent( '/all-services' );

			// Asserted before awaiting anything, to prove the tab rendered
			// without waiting for the default-tab routing state to resolve.
			expect( getByText( ALL_SERVICES_PLACEHOLDER ) ).toBeInTheDocument();

			await waitForRegistry();
		} );

		it( 'should respect direct tab URLs and remain switchable via hash-router navigation', async () => {
			const history = createMemoryHistory();
			const { container, getByText, queryByText, waitForRegistry } =
				renderContent( '/all-services', history );

			await waitForRegistry();

			expect( getByText( ALL_SERVICES_PLACEHOLDER ) ).toBeInTheDocument();

			act( () => {
				history.push( '/whats-new' );
			} );

			expect(
				container.querySelector( WHATS_NEW_SELECTOR )
			).toBeInTheDocument();
			expect(
				queryByText( ALL_SERVICES_PLACEHOLDER )
			).not.toBeInTheDocument();
			expect( history.action ).toBe( 'PUSH' );

			act( () => {
				history.goBack();
			} );

			expect( getByText( ALL_SERVICES_PLACEHOLDER ) ).toBeInTheDocument();
			expect( history.action ).toBe( 'POP' );

			await waitForRegistry();
		} );
	} );

	describe( 'default tab routing', () => {
		it( 'should not render or redirect while the routing state is resolving', async () => {
			fetchMock.post( dismissItemEndpoint, {
				body: [ FEATURE_DISCOVERY_VISITED_ITEM_SLUG ],
			} );
			registry
				.dispatch( CORE_USER )
				.receiveInitialSiteKitVersion( HUB_LAUNCH_VERSION );
			muteFetch( dismissedItemsEndpoint, [] );

			const { container, history, waitForRegistry } =
				renderContent( '/' );

			expect( container ).toBeEmptyDOMElement();
			expect( history.location.pathname ).toBe( '/' );

			await waitForRegistry();
		} );

		it( 'should redirect a first-visit user installed at or after HUB_LAUNCH_VERSION to /all-services', async () => {
			fetchMock.post( dismissItemEndpoint, {
				body: [ FEATURE_DISCOVERY_VISITED_ITEM_SLUG ],
			} );

			registry
				.dispatch( CORE_USER )
				.receiveInitialSiteKitVersion( HUB_LAUNCH_VERSION );
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			const { getByText, history, waitForRegistry } =
				renderContent( '/' );

			await waitForRegistry();

			expect( history.location.pathname ).toBe( '/all-services' );
			expect( history.action ).toBe( 'REPLACE' );
			expect( getByText( ALL_SERVICES_PLACEHOLDER ) ).toBeInTheDocument();
		} );

		it( 'should redirect a first-visit user installed before HUB_LAUNCH_VERSION to /whats-new', async () => {
			fetchMock.post( dismissItemEndpoint, {
				body: [ FEATURE_DISCOVERY_VISITED_ITEM_SLUG ],
			} );

			registry
				.dispatch( CORE_USER )
				.receiveInitialSiteKitVersion( '1.150.0' );
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			const { container, history, waitForRegistry } =
				renderContent( '/' );

			await waitForRegistry();

			expect( history.location.pathname ).toBe( '/whats-new' );
			expect( history.action ).toBe( 'REPLACE' );
			expect(
				container.querySelector( WHATS_NEW_SELECTOR )
			).toBeInTheDocument();
		} );

		it( 'should redirect a returning user to /whats-new even when their initial version would otherwise qualify as new', async () => {
			registry
				.dispatch( CORE_USER )
				.receiveInitialSiteKitVersion( HUB_LAUNCH_VERSION );
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					FEATURE_DISCOVERY_VISITED_ITEM_SLUG,
				] );

			const { container, history, waitForRegistry } =
				renderContent( '/' );

			await waitForRegistry();

			expect( history.location.pathname ).toBe( '/whats-new' );
			expect(
				container.querySelector( WHATS_NEW_SELECTOR )
			).toBeInTheDocument();
		} );

		it( 'should fall back to /whats-new when the initial version cannot be determined', async () => {
			fetchMock.post( dismissItemEndpoint, {
				body: [ FEATURE_DISCOVERY_VISITED_ITEM_SLUG ],
			} );

			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			const { container, history, waitForRegistry } =
				renderContent( '/' );

			await waitForRegistry();

			expect( history.location.pathname ).toBe( '/whats-new' );
			expect(
				container.querySelector( WHATS_NEW_SELECTOR )
			).toBeInTheDocument();
		} );
	} );

	describe( 'first-visit dismissal', () => {
		it( 'should write feature-discovery-visited permanently on first hub visit', async () => {
			fetchMock.post( dismissItemEndpoint, {
				body: [ FEATURE_DISCOVERY_VISITED_ITEM_SLUG ],
			} );

			registry
				.dispatch( CORE_USER )
				.receiveInitialSiteKitVersion( HUB_LAUNCH_VERSION );
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			const { waitForRegistry } = renderContent( '/' );

			await waitForRegistry();

			expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
				body: {
					data: {
						slug: FEATURE_DISCOVERY_VISITED_ITEM_SLUG,
						expiration: 0,
					},
				},
			} );
			expect( fetchMock ).toHaveFetchedTimes( 1, dismissItemEndpoint );
		} );

		it( 'should not rewrite feature-discovery-visited for a returning user', async () => {
			registry
				.dispatch( CORE_USER )
				.receiveInitialSiteKitVersion( HUB_LAUNCH_VERSION );
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					FEATURE_DISCOVERY_VISITED_ITEM_SLUG,
				] );

			const { waitForRegistry } = renderContent( '/' );

			await waitForRegistry();

			expect( fetchMock ).not.toHaveFetched( dismissItemEndpoint );
		} );

		it( 'should not dispatch the dismissal more than once while the first request is in flight', async () => {
			freezeFetch( dismissItemEndpoint );

			registry
				.dispatch( CORE_USER )
				.receiveInitialSiteKitVersion( HUB_LAUNCH_VERSION );
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			const { rerender, waitForRegistry } = renderContent( '/' );

			await waitForRegistry();

			rerender( <FeatureDiscoveryContent /> );
			rerender( <FeatureDiscoveryContent /> );

			expect( fetchMock ).toHaveFetchedTimes( 1, dismissItemEndpoint );
		} );
	} );
} );
