/**
 * Traffic Overview `useTrackPostLinkClick` hook tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { RECENT_ACTIVITY_INTERACTION_TIMER } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	provideRecentActivitySurveyState,
	setExpirableItemTimersEndpoint,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import * as tracking from '@/js/util/tracking';
import { act, createTestRegistry, renderHook } from '@tests/js/test-utils';
import { useTrackPostLinkClick } from './useTrackPostLinkClick';

describe( 'useTrackPostLinkClick', () => {
	let registry: WPDataRegistry;

	const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
	mockTrackEvent.mockImplementation( () => Promise.resolve() );

	beforeEach( () => {
		mockTrackEvent.mockClear();

		registry = createTestRegistry();
		provideRecentActivitySurveyState( registry );
		fetchMock.postOnce( setExpirableItemTimersEndpoint, {
			body: {},
			status: 200,
		} );
	} );

	it.each( [ 'latest-post-header', 'top-posts' ] as const )(
		'should track `click_post_link` labeled `%s` and record an interaction',
		async ( section ) => {
			const { result } = renderHook(
				() => useTrackPostLinkClick( section ),
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			await act( () => result.current() );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_recent-activity',
				'click_post_link',
				section
			);
			expect( fetchMock ).toHaveFetched( setExpirableItemTimersEndpoint, {
				body: {
					data: [
						{
							slug: RECENT_ACTIVITY_INTERACTION_TIMER.slug,
							expiration:
								RECENT_ACTIVITY_INTERACTION_TIMER.expiresInSeconds,
						},
					],
				},
			} );
		}
	);

	it( 'should resolve only once the interaction is saved', async () => {
		let resolveTimerRequest: ( () => void ) | undefined;
		fetchMock.postOnce(
			setExpirableItemTimersEndpoint,
			new Promise( ( resolve ) => {
				resolveTimerRequest = () =>
					resolve( { body: {}, status: 200 } );
			} ),
			{ overwriteRoutes: true }
		);

		const { result } = renderHook(
			() => useTrackPostLinkClick( 'latest-post-header' ),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		let isResolved = false;
		let promise: Promise< void > | undefined;

		act( () => {
			promise = result.current().then( () => {
				isResolved = true;
			} );
		} );

		await act( () => new Promise( ( resolve ) => setTimeout( resolve ) ) );

		expect( isResolved ).toBe( false );

		await act( async () => {
			resolveTimerRequest?.();
			await promise;
		} );

		expect( isResolved ).toBe( true );
	} );
} );
