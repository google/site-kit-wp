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
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createTestRegistry, render } from '@tests/js/test-utils';
import FeatureDiscoveryContent from './FeatureDiscoveryContent';

const ALL_SERVICES_SELECTOR = '.googlesitekit-all-services-tab';

const WHATS_NEW_SELECTOR = '.googlesitekit-whats-new';

describe( 'FeatureDiscoveryContent', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		// The What’s new? tab reads the user's newness state, which is left
		// empty here so that no feature is listed.
		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.186.0' );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
	} );

	it( 'should render only the tab panel content for /all-services', () => {
		const { container } = render( <FeatureDiscoveryContent />, {
			registry,
			route: '/all-services',
		} );

		expect(
			container.querySelector( ALL_SERVICES_SELECTOR )
		).toBeInTheDocument();

		expect(
			container.querySelector( WHATS_NEW_SELECTOR )
		).not.toBeInTheDocument();
	} );

	it( 'should render only the tab panel content for /whats-new', () => {
		const { container } = render( <FeatureDiscoveryContent />, {
			registry,
			route: '/whats-new',
		} );

		expect(
			container.querySelector( WHATS_NEW_SELECTOR )
		).toBeInTheDocument();

		expect(
			container.querySelector( ALL_SERVICES_SELECTOR )
		).not.toBeInTheDocument();
	} );

	it( 'should redirect base path to /whats-new', () => {
		const { container, history } = render( <FeatureDiscoveryContent />, {
			registry,
			route: '/',
		} );

		expect( history.location.pathname ).toBe( '/whats-new' );
		expect( history.action ).toBe( 'REPLACE' );

		expect(
			container.querySelector( WHATS_NEW_SELECTOR )
		).toBeInTheDocument();
	} );

	it( 'should redirect unknown paths to /whats-new', () => {
		const { container, history } = render( <FeatureDiscoveryContent />, {
			registry,
			route: '/unknown',
		} );

		expect( history.location.pathname ).toBe( '/whats-new' );
		expect( history.action ).toBe( 'REPLACE' );

		expect(
			container.querySelector( WHATS_NEW_SELECTOR )
		).toBeInTheDocument();
	} );
} );
