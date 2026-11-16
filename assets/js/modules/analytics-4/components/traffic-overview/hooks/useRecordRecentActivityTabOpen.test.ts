/**
 * Traffic Overview `useRecordRecentActivityTabOpen` hook tests.
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
	RECENT_ACTIVITY_INTERACTION_TIMER,
	RECENT_ACTIVITY_TAB_OPENED_TIMER,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	getExpiryFromNow,
	provideRecentActivitySurveyState,
	requestedTimerSlugs,
	setExpirableItemTimersEndpoint,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { DAY_IN_SECONDS } from '@/js/util/dates';
import { dismissPromptEndpoint } from '@tests/js/mock-dismiss-prompt-endpoints';
import { act, createTestRegistry, renderHook } from '@tests/js/test-utils';
import { useRecordRecentActivityTabOpen } from './useRecordRecentActivityTabOpen';

describe( 'useRecordRecentActivityTabOpen', () => {
	const expirableItemsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/expirable-items'
	);

	let registry: WPDataRegistry;

	function render() {
		return renderHook( () => useRecordRecentActivityTabOpen(), {
			registry,
		} );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		// The response has the "tab opened" timer, the way it does after the
		// first open, so a second open in the same page load would record an
		// interaction if the callback ran again.
		fetchMock.post( setExpirableItemTimersEndpoint, {
			body: {
				[ RECENT_ACTIVITY_TAB_OPENED_TIMER.slug ]: getExpiryFromNow(
					RECENT_ACTIVITY_TAB_OPENED_TIMER.expiresInSeconds
				),
			},
			status: 200,
		} );
		// A route for a request the hook must not send, so the assertions
		// that it sends none can fail.
		fetchMock.post( dismissPromptEndpoint, { body: {}, status: 200 } );
	} );

	it( 'should start the "tab opened" timer, and record no interaction, when the user opens the tab for the first time', async () => {
		provideRecentActivitySurveyState( registry );

		const { result } = render();

		await act( () => result.current() );

		expect( fetchMock ).toHaveFetched( setExpirableItemTimersEndpoint, {
			body: {
				data: [
					{
						slug: RECENT_ACTIVITY_TAB_OPENED_TIMER.slug,
						expiration:
							RECENT_ACTIVITY_TAB_OPENED_TIMER.expiresInSeconds,
					},
				],
			},
		} );
		expect( requestedTimerSlugs() ).toEqual( [
			RECENT_ACTIVITY_TAB_OPENED_TIMER.slug,
		] );
		expect( fetchMock ).not.toHaveFetched( dismissPromptEndpoint );
	} );

	it.each( [
		[ 'active', DAY_IN_SECONDS ],
		[ 'expired', -DAY_IN_SECONDS ],
	] )(
		'should record an interaction, and not restart the "tab opened" timer, when the user opens the tab in a later page load, with the timer %s',
		async ( _state, secondsFromNow ) => {
			provideRecentActivitySurveyState( registry, {
				expirableItems: {
					[ RECENT_ACTIVITY_TAB_OPENED_TIMER.slug ]:
						getExpiryFromNow( secondsFromNow ),
				},
			} );

			const { result } = render();

			await act( () => result.current() );

			expect( requestedTimerSlugs() ).toEqual( [
				RECENT_ACTIVITY_INTERACTION_TIMER.slug,
			] );
		}
	);

	it( 'should record only the first open in a page load', async () => {
		provideRecentActivitySurveyState( registry );

		const { result } = render();

		await act( () => result.current() );
		await act( () => result.current() );

		expect( requestedTimerSlugs() ).toEqual( [
			RECENT_ACTIVITY_TAB_OPENED_TIMER.slug,
		] );
	} );

	it( 'should load the expirable items before deciding whether the open is an interaction', async () => {
		fetchMock.getOnce( expirableItemsEndpoint, {
			body: {
				[ RECENT_ACTIVITY_TAB_OPENED_TIMER.slug ]:
					getExpiryFromNow( DAY_IN_SECONDS ),
			},
			status: 200,
		} );

		const { result } = render();

		await act( () => result.current() );

		expect( fetchMock ).toHaveFetched( expirableItemsEndpoint );
		expect( requestedTimerSlugs() ).toEqual( [
			RECENT_ACTIVITY_INTERACTION_TIMER.slug,
		] );
	} );

	it( 'should start no timer when the expirable items fail to load', async () => {
		fetchMock.getOnce( expirableItemsEndpoint, {
			body: { code: 'internal_server_error', message: 'Error' },
			status: 500,
		} );

		const { result } = render();

		await act( () => result.current() );

		expect( console ).toHaveErrored();
		expect( fetchMock ).not.toHaveFetched( setExpirableItemTimersEndpoint );
	} );
} );
