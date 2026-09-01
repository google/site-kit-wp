/**
 * Setup CTA visibility helper tests.
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
import { Select } from 'googlesitekit-data';
import { enabledFeatures } from '@/js/features';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG,
} from '@/js/googlesitekit/datastore/user/constants';
import { NOTIFICATION_GROUPS } from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { createTestRegistry } from '@tests/js/utils';
import {
	requireSetupCTAsNotHidden,
	shouldHideSetupCTAs,
} from './setup-cta-visibility';

describe( 'shouldHideSetupCTAs', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	function callHelper() {
		return shouldHideSetupCTAs(
			registry.select as Select,
			VIEW_CONTEXT_MAIN_DASHBOARD
		);
	}

	function receiveFirstHeaderNotification( id: string ) {
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.receiveQueuedNotifications(
				[ { id } ],
				NOTIFICATION_GROUPS.DEFAULT
			);
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		enabledFeatures.add( 'setupFlowRefresh' );
	} );

	afterEach( () => {
		enabledFeatures.delete( 'setupFlowRefresh' );
	} );

	it( 'returns false when setupFlowRefresh is disabled', () => {
		enabledFeatures.delete( 'setupFlowRefresh' );

		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG,
			] );

		expect( callHelper() ).toBe( false );
	} );

	it( 'returns false when nothing suppresses the setup CTAs', () => {
		expect( callHelper() ).toBe( false );
	} );

	it( 'returns true when the initial setup notification timeout is dismissed', () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG,
			] );

		expect( callHelper() ).toBe( true );
	} );

	it( 'returns true when activate-analytics-notification is first in the header queue', () => {
		receiveFirstHeaderNotification( 'activate-analytics-notification' );

		expect( callHelper() ).toBe( true );
	} );

	it( 'returns true when connect-more-services-notification is first in the header queue', () => {
		receiveFirstHeaderNotification( 'connect-more-services-notification' );

		expect( callHelper() ).toBe( true );
	} );

	it( 'returns false when another notification is first in the header queue', () => {
		receiveFirstHeaderNotification( 'some-other-notification' );

		expect( callHelper() ).toBe( false );
	} );
} );

describe( 'requireSetupCTAsNotHidden', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	function callRequirement() {
		return requireSetupCTAsNotHidden()(
			registry as never,
			VIEW_CONTEXT_MAIN_DASHBOARD
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();
		enabledFeatures.add( 'setupFlowRefresh' );
	} );

	afterEach( () => {
		enabledFeatures.delete( 'setupFlowRefresh' );
	} );

	it( 'returns a callback rather than a verdict', () => {
		expect( typeof requireSetupCTAsNotHidden() ).toBe( 'function' );
	} );

	it( 'resolves true when nothing suppresses the setup CTAs', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.receiveQueuedNotifications( [], NOTIFICATION_GROUPS.DEFAULT );

		await expect( callRequirement() ).resolves.toBe( true );
	} );

	it( 'resolves false when the initial setup notification timeout is dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG,
			] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.receiveQueuedNotifications( [], NOTIFICATION_GROUPS.DEFAULT );

		await expect( callRequirement() ).resolves.toBe( false );
	} );

	// The `await` is the only thing this adds over `shouldHideSetupCTAs`: both
	// selectors it reads report `undefined` until they resolve, which reads as
	// "nothing to hide" and would let the overlay through on the very load it is
	// meant to stay off.
	it( 'waits for the dismissed items to arrive before deciding', async () => {
		// A delayed response is the whole point: read synchronously, the store
		// still says nothing is dismissed, so an unawaited check would resolve
		// `true` and let the overlay through.
		// `get`, not `getOnce`: the synchronous read below starts the resolver,
		// so the endpoint is asked for twice.
		fetchMock.get(
			new RegExp( '^/google-site-kit/v1/core/user/data/dismissed-items' ),
			() =>
				new Promise( ( resolve ) =>
					setTimeout(
						() =>
							resolve( {
								body: [
									INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG,
								],
								status: 200,
							} ),
						50
					)
				)
		);
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.receiveQueuedNotifications( [], NOTIFICATION_GROUPS.DEFAULT );

		expect(
			shouldHideSetupCTAs(
				registry.select as Select,
				VIEW_CONTEXT_MAIN_DASHBOARD
			)
		).toBe( false );

		await expect( callRequirement() ).resolves.toBe( false );
	} );
} );
