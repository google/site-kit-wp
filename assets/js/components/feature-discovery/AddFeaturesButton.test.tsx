/**
 * AddFeaturesButton tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { getFeatureNewnessKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	provideSiteInfo,
	render,
} from '@tests/js/test-utils';
import AddFeaturesButton from './AddFeaturesButton';

describe( 'AddFeaturesButton', () => {
	const buttonLabel = 'Add features';
	const siteKitVersion = '1.160.0';

	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );

		// Register a test feature, in the "new" state.
		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( 'test-feature', {
				title: 'Test feature',
				shortDescription: 'A feature used in tests.',
				effort: FEATURE_EFFORTS.LOW,
				goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
				addedInVersion: siteKitVersion,
				setup: {
					type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
					isEnabled: () => false,
				},
			} );

		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( siteKitVersion );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
	} );

	it( 'renders correctly', () => {
		const { container, getByRole } = render( <AddFeaturesButton />, {
			registry,
			features: [ 'featureDiscoveryHub' ],
		} );

		expect( container ).toMatchSnapshot();

		expect(
			getByRole( 'link', { name: buttonLabel } )
		).toBeInTheDocument();
	} );

	it( 'links to the Feature Discovery Hub', () => {
		const { getByRole } = render( <AddFeaturesButton />, {
			registry,
			features: [ 'featureDiscoveryHub' ],
		} );

		expect( getByRole( 'link', { name: buttonLabel } ) ).toHaveAttribute(
			'href',
			registry.select( CORE_SITE ).getAdminURL( 'googlesitekit-features' )
		);
	} );

	it( 'shows the new features indicator when there are new features', () => {
		const { getByText } = render( <AddFeaturesButton />, {
			registry,
			features: [ 'featureDiscoveryHub' ],
		} );

		expect( getByText( 'New features available' ) ).toBeInTheDocument();
	} );

	it( 'does not show the new features indicator when there are no new features', () => {
		// Mark the test feature as seen.
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {
			[ getFeatureNewnessKey( 'test-feature' ) ]: Math.floor(
				Date.now() / 1000
			),
		} );

		const { container, queryByText } = render( <AddFeaturesButton />, {
			registry,
			features: [ 'featureDiscoveryHub' ],
		} );

		expect( container ).toMatchSnapshot();

		expect(
			queryByText( 'New features available' )
		).not.toBeInTheDocument();
	} );

	it( 'renders nothing when the featureDiscoveryHub feature flag is not enabled', () => {
		const { container, queryByRole } = render( <AddFeaturesButton />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
		expect(
			queryByRole( 'link', { name: buttonLabel } )
		).not.toBeInTheDocument();
	} );

	it( 'renders nothing on a view-only dashboard', () => {
		const { container, queryByRole } = render( <AddFeaturesButton />, {
			registry,
			features: [ 'featureDiscoveryHub' ],
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( container ).toBeEmptyDOMElement();
		expect(
			queryByRole( 'link', { name: buttonLabel } )
		).not.toBeInTheDocument();
	} );
} );
