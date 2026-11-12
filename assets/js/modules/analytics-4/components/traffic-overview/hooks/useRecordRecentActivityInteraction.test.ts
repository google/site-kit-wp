/**
 * Traffic Overview `useRecordRecentActivityInteraction` hook tests.
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
import { RECENT_ACTIVITY_INTERACTION_TIMER } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	getExpiryFromNow,
	provideRecentActivitySurveyState,
	setExpirableItemTimersEndpoint,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { DAY_IN_SECONDS } from '@/js/util/dates';
import { act, createTestRegistry, renderHook } from '@tests/js/test-utils';
import { useRecordRecentActivityInteraction } from './useRecordRecentActivityInteraction';

describe( 'useRecordRecentActivityInteraction', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should start the "meaningful interaction" timer for 7 days', async () => {
		provideRecentActivitySurveyState( registry );
		fetchMock.postOnce( setExpirableItemTimersEndpoint, {
			body: {
				[ RECENT_ACTIVITY_INTERACTION_TIMER.slug ]: getExpiryFromNow(
					7 * DAY_IN_SECONDS
				),
			},
			status: 200,
		} );

		const { result } = renderHook(
			() => useRecordRecentActivityInteraction(),
			{ registry }
		);

		await act( () => result.current() );

		expect( fetchMock ).toHaveFetchedTimes(
			1,
			setExpirableItemTimersEndpoint
		);
		expect( fetchMock ).toHaveFetched( setExpirableItemTimersEndpoint, {
			body: {
				data: [
					{
						slug: RECENT_ACTIVITY_INTERACTION_TIMER.slug,
						expiration: 7 * DAY_IN_SECONDS,
					},
				],
			},
		} );
	} );

	it( 'should start the "meaningful interaction" timer only once', async () => {
		provideRecentActivitySurveyState( registry );
		fetchMock.postOnce( setExpirableItemTimersEndpoint, {
			body: {
				[ RECENT_ACTIVITY_INTERACTION_TIMER.slug ]: getExpiryFromNow(
					7 * DAY_IN_SECONDS
				),
			},
			status: 200,
		} );

		const { result } = renderHook(
			() => useRecordRecentActivityInteraction(),
			{ registry }
		);

		await act( () => result.current() );
		await act( () => result.current() );

		expect( fetchMock ).toHaveFetchedTimes(
			1,
			setExpirableItemTimersEndpoint
		);
	} );

	it( 'should not restart the "meaningful interaction" timer when it has expired', async () => {
		provideRecentActivitySurveyState( registry, {
			expirableItems: {
				[ RECENT_ACTIVITY_INTERACTION_TIMER.slug ]: getExpiryFromNow(
					-DAY_IN_SECONDS
				),
			},
		} );

		const { result } = renderHook(
			() => useRecordRecentActivityInteraction(),
			{ registry }
		);

		await act( () => result.current() );

		expect( fetchMock ).not.toHaveFetched( setExpirableItemTimersEndpoint );
	} );
} );
