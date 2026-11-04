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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	RECENT_ACTIVITY_INTERACTION_TIMER,
	RECENT_ACTIVITY_TAB_OPENED_TIMER,
	RECENT_ACTIVITY_TAB_OPEN_COUNT_PROMPT_SLUG,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	provideRecentActivitySurveyState,
	setExpirableItemTimersEndpoint,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import {
	dismissPromptEndpoint,
	dismissedPromptsEndpoint,
} from '@tests/js/mock-dismiss-prompt-endpoints';
import {
	act,
	createTestRegistry,
	renderHook,
	waitFor,
} from '@tests/js/test-utils';
import { useRecordRecentActivityTabOpen } from './useRecordRecentActivityTabOpen';

describe( 'useRecordRecentActivityTabOpen', () => {
	let registry: WPDataRegistry;

	function requestedTimerSlugs(): string[] {
		return fetchMock
			.calls( setExpirableItemTimersEndpoint )
			.flatMap( ( call ) =>
				JSON.parse( String( call[ 1 ]?.body ) ).data.map(
					( { slug }: { slug: string } ) => slug
				)
			);
	}

	function tabOpenCount( count: number ) {
		return {
			[ RECENT_ACTIVITY_TAB_OPEN_COUNT_PROMPT_SLUG ]: {
				expires: 0,
				count,
			},
		};
	}

	// The response to a counted tab open has the count after the open.
	function mockTabOpenCount( count: number ) {
		fetchMock.post( dismissPromptEndpoint, {
			body: tabOpenCount( count ),
			status: 200,
		} );
	}

	function render() {
		return renderHook( () => useRecordRecentActivityTabOpen(), {
			registry,
		} );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		fetchMock.post( setExpirableItemTimersEndpoint, {
			body: {},
			status: 200,
		} );
	} );

	it( 'should start the "tab opened" timer and count the tab open', async () => {
		provideRecentActivitySurveyState( registry );
		mockTabOpenCount( 1 );

		const { result } = render();

		await act( () => result.current() );

		// The callback does not wait for the timer to start.
		await waitFor( () =>
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
			} )
		);
		expect( fetchMock ).toHaveFetched( dismissPromptEndpoint, {
			body: {
				data: {
					slug: RECENT_ACTIVITY_TAB_OPEN_COUNT_PROMPT_SLUG,
					expiration: 0,
				},
			},
		} );
	} );

	it( 'should count the tab open only once per page load', async () => {
		provideRecentActivitySurveyState( registry );
		mockTabOpenCount( 1 );

		const { result } = render();

		await act( () => result.current() );
		await act( () => result.current() );

		expect( fetchMock ).toHaveFetchedTimes( 1, dismissPromptEndpoint );
	} );

	it.each( [
		[ 'should not record', 'the first', 1, false ],
		[ 'should record', 'the second', 2, true ],
	] )(
		'%s an interaction when the user opens the tab in %s page load',
		async ( _description, _pageLoad, count, shouldRecord ) => {
			provideRecentActivitySurveyState( registry );
			mockTabOpenCount( count );

			const { result } = render();

			await act( () => result.current() );

			expect(
				requestedTimerSlugs().includes(
					RECENT_ACTIVITY_INTERACTION_TIMER.slug
				)
			).toBe( shouldRecord );
		}
	);

	it( 'should load the dismissed prompts before counting the tab open, so their response cannot replace the count', async () => {
		// The expirable items load, but the dismissed prompts do not.
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );

		// The dismissed prompts, from before this open.
		let resolveDismissedPrompts: ( () => void ) | undefined;
		fetchMock.getOnce(
			dismissedPromptsEndpoint,
			new Promise( ( resolve ) => {
				resolveDismissedPrompts = () =>
					resolve( { body: tabOpenCount( 1 ), status: 200 } );
			} )
		);
		mockTabOpenCount( 2 );

		const { result } = render();

		let promise: Promise< void > | undefined;

		act( () => {
			promise = result.current();
		} );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( dismissedPromptsEndpoint )
		);

		expect( fetchMock ).not.toHaveFetched( dismissPromptEndpoint );

		await act( async () => {
			resolveDismissedPrompts?.();
			await promise;
		} );

		expect( fetchMock ).toHaveFetched( dismissPromptEndpoint );
		expect(
			registry
				.select( CORE_USER )
				.getPromptDismissCount(
					RECENT_ACTIVITY_TAB_OPEN_COUNT_PROMPT_SLUG
				)
		).toBe( 2 );
		expect( requestedTimerSlugs() ).toContain(
			RECENT_ACTIVITY_INTERACTION_TIMER.slug
		);
	} );
} );
