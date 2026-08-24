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
import { shouldHideSetupCTAs } from './setup-cta-visibility';

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
