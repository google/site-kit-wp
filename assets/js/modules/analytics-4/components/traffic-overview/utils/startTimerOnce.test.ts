/**
 * Traffic Overview `startTimerOnce` utility tests.
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
import { Registry } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	getExpiryFromNow,
	setExpirableItemTimersEndpoint,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { createTestRegistry } from '@tests/js/test-utils';
import { startTimerOnce } from './startTimerOnce';

describe( 'startTimerOnce', () => {
	const expirableItemsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/expirable-items'
	);

	const TIMER = { slug: 'test-timer', expiresInSeconds: 3600 };

	let registry: Registry;

	// A route for the timer request, so a test that expects no timer request
	// fails on its own assertion, not on an unmatched request.
	function mockSetExpirableItemTimers() {
		fetchMock.postOnce( setExpirableItemTimersEndpoint, {
			body: { [ TIMER.slug ]: getExpiryFromNow( 3600 ) },
			status: 200,
		} );
	}

	beforeEach( () => {
		registry = createTestRegistry() as unknown as Registry;
	} );

	it( 'should load the expirable items, then start the timer when the user does not have it', async () => {
		fetchMock.getOnce( expirableItemsEndpoint, { body: {}, status: 200 } );
		mockSetExpirableItemTimers();

		await startTimerOnce( registry, TIMER );

		expect( fetchMock ).toHaveFetched( setExpirableItemTimersEndpoint, {
			body: { data: [ { slug: TIMER.slug, expiration: 3600 } ] },
		} );
		expect(
			registry.select( CORE_USER ).hasExpirableItem( TIMER.slug )
		).toBe( true );
	} );

	it( 'should send one request when it is called again before the first call finishes', async () => {
		fetchMock.getOnce( expirableItemsEndpoint, { body: {}, status: 200 } );
		mockSetExpirableItemTimers();

		await Promise.all( [
			startTimerOnce( registry, TIMER ),
			startTimerOnce( registry, TIMER ),
		] );

		expect( fetchMock ).toHaveFetchedTimes(
			1,
			setExpirableItemTimersEndpoint
		);
	} );

	it( 'should start each timer when it is called for two timers at once', async () => {
		const OTHER_TIMER = { slug: 'other-timer', expiresInSeconds: 60 };

		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
		fetchMock.post( setExpirableItemTimersEndpoint, {
			body: {},
			status: 200,
		} );

		await Promise.all( [
			startTimerOnce( registry, TIMER ),
			startTimerOnce( registry, OTHER_TIMER ),
		] );

		expect( fetchMock ).toHaveFetchedTimes(
			2,
			setExpirableItemTimersEndpoint
		);
	} );

	it.each( [
		[ 'active', 3600 ],
		[ 'expired', -3600 ],
	] )(
		'should not restart the timer when the user has it %s',
		async ( _state, secondsFromNow ) => {
			registry.dispatch( CORE_USER ).receiveGetExpirableItems( {
				[ TIMER.slug ]: getExpiryFromNow( secondsFromNow ),
			} );
			mockSetExpirableItemTimers();

			await startTimerOnce( registry, TIMER );

			expect( fetchMock ).not.toHaveFetched(
				setExpirableItemTimersEndpoint
			);
		}
	);

	it( 'should not start the timer when the expirable items fail to load', async () => {
		fetchMock.getOnce( expirableItemsEndpoint, {
			body: { code: 'internal_server_error', message: 'Error' },
			status: 500,
		} );
		mockSetExpirableItemTimers();

		await startTimerOnce( registry, TIMER );

		expect( console ).toHaveErrored();
		expect( fetchMock ).not.toHaveFetched( setExpirableItemTimersEndpoint );
	} );
} );
