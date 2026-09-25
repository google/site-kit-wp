/**
 * WhatsNewTab component tests.
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
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureNewnessKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { WEEK_IN_SECONDS } from '@/js/util';
import {
	createTestRegistry,
	freezeFetch,
	provideModules,
	render,
} from '@tests/js/test-utils';
import WhatsNewTab from './WhatsNewTab';

const TEST_INITIAL_VERSION = '1.186.0';
const TEST_OLDER_VERSION = '1.186.0';
const TEST_NEWER_VERSION = '1.188.0';

const EMPTY_STATE_SELECTOR = '.googlesitekit-whats-new__empty-state';

const TIMERS_ENDPOINT = new RegExp(
	'^/google-site-kit/v1/core/user/data/set-expirable-item-timers'
);

// Registration order deliberately differs from the order the features are
// expected to list in, so the assertions exercise the sorting.
const TEST_FEATURES: Partial< Feature >[] = [
	{
		slug: 'seen-older',
		title: 'Seen older feature',
		addedInVersion: TEST_OLDER_VERSION,
	},
	{
		slug: 'seen-newer',
		title: 'Seen newer feature',
		addedInVersion: TEST_NEWER_VERSION,
	},
	{
		slug: 'unread-older',
		title: 'Unread older feature',
		addedInVersion: TEST_OLDER_VERSION,
	},
	{
		slug: 'unread-newer',
		title: 'Unread newer feature',
		addedInVersion: TEST_NEWER_VERSION,
	},
];

const INITIAL_ORDER = [
	'Unread newer feature',
	'Unread older feature',
	'Seen newer feature',
	'Seen older feature',
];

describe( 'WhatsNewTab', () => {
	let registry: Registry;

	// A timer that has been started but has not yet expired, so the feature is
	// seen but still listed.
	function activeTimer() {
		return (
			// eslint-disable-next-line sitekit/no-direct-date -- Timers are evaluated against the current time.
			Math.floor( Date.now() / 1000 ) + WEEK_IN_SECONDS * 4
		);
	}

	function getListedTitles( container: Element ) {
		return Array.from(
			container.querySelectorAll( '.googlesitekit-feature-card__heading' )
		).map( ( heading ) => heading.textContent );
	}

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideModules( registry, [] );

		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( TEST_INITIAL_VERSION );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {
			[ getFeatureNewnessKey( 'seen-older' ) ]: activeTimer(),
			[ getFeatureNewnessKey( 'seen-newer' ) ]: activeTimer(),
		} );
	} );

	it( 'should list the features that are new to the user, unseen first and newest first within each group', async () => {
		fetchMock.postOnce( TIMERS_ENDPOINT, { body: {}, status: 200 } );

		provideFeatures( registry, TEST_FEATURES );

		const { container, waitForRegistry } = render( <WhatsNewTab />, {
			registry,
		} );

		await waitForRegistry();

		expect( getListedTitles( container ) ).toEqual( INITIAL_ORDER );
	} );

	it( 'should mark the listed features that have not been seen yet', async () => {
		fetchMock.postOnce( TIMERS_ENDPOINT, { body: {}, status: 200 } );

		provideFeatures( registry, TEST_FEATURES );

		const { waitForRegistry } = render( <WhatsNewTab />, { registry } );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( TIMERS_ENDPOINT, {
			body: {
				data: [
					{
						slug: getFeatureNewnessKey( 'unread-newer' ),
						expiration: WEEK_IN_SECONDS * 4,
					},
					{
						slug: getFeatureNewnessKey( 'unread-older' ),
						expiration: WEEK_IN_SECONDS * 4,
					},
				],
			},
		} );
	} );

	it( 'should keep its initial order once the listed features are marked seen', async () => {
		// Responding with a timer for every feature makes them all seen, which
		// would re-sort the list if it were read from the selector again.
		fetchMock.postOnce( TIMERS_ENDPOINT, {
			body: {
				[ getFeatureNewnessKey( 'seen-older' ) ]: activeTimer(),
				[ getFeatureNewnessKey( 'seen-newer' ) ]: activeTimer(),
				[ getFeatureNewnessKey( 'unread-older' ) ]: activeTimer(),
				[ getFeatureNewnessKey( 'unread-newer' ) ]: activeTimer(),
			},
			status: 200,
		} );

		provideFeatures( registry, TEST_FEATURES );

		const { container, waitForRegistry } = render( <WhatsNewTab />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			registry
				.select( CORE_FEATURE_DISCOVERY )
				.getWhatsNewFeatures()
				.map( ( feature: Feature ) => feature.title )
		).not.toEqual( INITIAL_ORDER );

		expect( getListedTitles( container ) ).toEqual( INITIAL_ORDER );
	} );

	it( 'should render each listed feature with its dismiss control and without the New badge', async () => {
		fetchMock.postOnce( TIMERS_ENDPOINT, { body: {}, status: 200 } );

		provideFeatures( registry, [ TEST_FEATURES[ 2 ] ] );

		const { getByRole, queryByText, waitForRegistry } = render(
			<WhatsNewTab />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			getByRole( 'button', { name: 'Dismiss Unread older feature' } )
		).toBeInTheDocument();

		expect( queryByText( 'New' ) ).not.toBeInTheDocument();
	} );

	it( 'should render the empty state and mark nothing seen when no features are new', async () => {
		const { container, waitForRegistry } = render( <WhatsNewTab />, {
			registry,
		} );

		await waitForRegistry();

		expect( getListedTitles( container ) ).toEqual( [] );

		expect(
			container.querySelector( EMPTY_STATE_SELECTOR )
		).toBeInTheDocument();

		expect( fetchMock ).not.toHaveFetched( TIMERS_ENDPOINT );
	} );

	it( 'should not render the empty state when there are features to list', async () => {
		fetchMock.postOnce( TIMERS_ENDPOINT, { body: {}, status: 200 } );

		provideFeatures( registry, TEST_FEATURES );

		const { container, waitForRegistry } = render( <WhatsNewTab />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			container.querySelector( EMPTY_STATE_SELECTOR )
		).not.toBeInTheDocument();
	} );

	it( 'should list nothing while the newness state is loading', () => {
		registry = createTestRegistry() as Registry;

		provideModules( registry, [] );

		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( TEST_INITIAL_VERSION );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		freezeFetch(
			new RegExp( '^/google-site-kit/v1/core/user/data/expirable-items' )
		);

		provideFeatures( registry, TEST_FEATURES );

		const { container } = render( <WhatsNewTab />, { registry } );

		expect( getListedTitles( container ) ).toEqual( [] );

		// The empty state must wait for the list, rather than flashing up in
		// place of features that are still loading.
		expect(
			container.querySelector( EMPTY_STATE_SELECTOR )
		).not.toBeInTheDocument();

		expect( fetchMock ).not.toHaveFetched( TIMERS_ENDPOINT );
	} );
} );
