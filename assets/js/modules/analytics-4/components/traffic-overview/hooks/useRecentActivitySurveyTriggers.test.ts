/**
 * Traffic Overview `useRecentActivitySurveyTriggers` hook tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	RECENT_ACTIVITY_INTERACTION_TIMER,
	RECENT_ACTIVITY_SURVEY_TRIGGER_OPENED_AND_INTERACTED,
	RECENT_ACTIVITY_SURVEY_TRIGGER_OPENED_BUT_NOT_INTERACTED,
	RECENT_ACTIVITY_SURVEY_TRIGGER_ZERO_INTERACTION,
	RECENT_ACTIVITY_TAB_AVAILABLE_TIMER,
	RECENT_ACTIVITY_TAB_OPENED_TIMER,
	TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	LATEST_POST,
	getExpiryFromNow,
	provideLatestPost,
	provideRecentActivitySurveyState,
	setExpirableItemTimersEndpoint,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { provideIncludeProductsState } from '@/js/modules/analytics-4/datastore/test-utils';
import { DAY_IN_SECONDS } from '@/js/util/dates';
import { dismissPromptEndpoint } from '@tests/js/mock-dismiss-prompt-endpoints';
import {
	surveyTimeoutsEndpoint,
	surveyTriggerEndpoint,
	triggeredIDs,
} from '@tests/js/mock-survey-endpoints';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	renderHook,
	waitFor,
	waitForDefaultTimeouts,
} from '@tests/js/test-utils';
import { freezeFetch } from '@tests/js/utils';
import { useRecentActivitySurveyTriggers } from './useRecentActivitySurveyTriggers';

describe( 'useRecentActivitySurveyTriggers', () => {
	const REFERENCE_DATE = '2026-10-01';

	// `LATEST_POST` was published 14 days before the reference date.
	// Published 7 days before the reference date.
	const RECENT_POST = { ...LATEST_POST, publishedAt: '2026-09-24T12:30:00Z' };

	const ACTIVE = getExpiryFromNow( DAY_IN_SECONDS );
	const EXPIRED = getExpiryFromNow( -DAY_IN_SECONDS );

	let registry: WPDataRegistry;

	function timerRequests(): unknown[] {
		return fetchMock
			.calls( setExpirableItemTimersEndpoint )
			.map( ( call ) => JSON.parse( String( call[ 1 ]?.body ) ).data );
	}

	// The response to a visit has the visit count after the visit.
	function mockVisit( count: number ) {
		fetchMock.post( dismissPromptEndpoint, {
			body: {
				[ TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG ]: { expires: 0, count },
			},
			status: 200,
		} );
	}

	function render( { isEnabled = true, hasBeenInView = true } = {} ) {
		return renderHook(
			( props: { isEnabled: boolean; hasBeenInView: boolean } ) =>
				useRecentActivitySurveyTriggers( props ),
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				initialProps: { isEnabled, hasBeenInView },
			}
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( REFERENCE_DATE );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideSiteInfo( registry );

		fetchMock.get( surveyTimeoutsEndpoint, { status: 200, body: [] } );
		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );
		fetchMock.post( setExpirableItemTimersEndpoint, {
			status: 200,
			body: {},
		} );
	} );

	describe( 'opened and interacted', () => {
		it( 'should trigger the survey once a day when the "meaningful interaction" timer has expired', async () => {
			provideRecentActivitySurveyState( registry, {
				expirableItems: {
					[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]: ACTIVE,
					[ RECENT_ACTIVITY_TAB_OPENED_TIMER.slug ]: EXPIRED,
					[ RECENT_ACTIVITY_INTERACTION_TIMER.slug ]: EXPIRED,
				},
			} );
			mockVisit( 1 );

			const { waitForRegistry } = render();
			await waitForRegistry();

			await waitFor( () =>
				expect( triggeredIDs() ).toEqual( [
					RECENT_ACTIVITY_SURVEY_TRIGGER_OPENED_AND_INTERACTED,
				] )
			);
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: {
						triggerID:
							RECENT_ACTIVITY_SURVEY_TRIGGER_OPENED_AND_INTERACTED,
						ttl: DAY_IN_SECONDS,
					},
				},
			} );
		} );

		it( 'should not trigger any survey while the "meaningful interaction" timer is active', async () => {
			provideRecentActivitySurveyState( registry, {
				expirableItems: {
					[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]: ACTIVE,
					[ RECENT_ACTIVITY_TAB_OPENED_TIMER.slug ]: EXPIRED,
					[ RECENT_ACTIVITY_INTERACTION_TIMER.slug ]: ACTIVE,
				},
			} );
			provideLatestPost( registry, RECENT_POST );
			mockVisit( 1 );

			const { waitForRegistry } = render();
			await waitForRegistry();
			await waitForDefaultTimeouts();

			expect( triggeredIDs() ).toEqual( [] );
		} );
	} );

	describe( 'opened but not interacted', () => {
		it( 'should trigger the survey when the "tab opened" timer has expired and there is no "meaningful interaction" timer', async () => {
			provideRecentActivitySurveyState( registry, {
				expirableItems: {
					[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]: ACTIVE,
					[ RECENT_ACTIVITY_TAB_OPENED_TIMER.slug ]: EXPIRED,
				},
			} );
			mockVisit( 1 );

			const { waitForRegistry } = render();
			await waitForRegistry();

			await waitFor( () =>
				expect( triggeredIDs() ).toEqual( [
					RECENT_ACTIVITY_SURVEY_TRIGGER_OPENED_BUT_NOT_INTERACTED,
				] )
			);
		} );

		it( 'should not trigger any survey while the "tab opened" timer is active', async () => {
			provideRecentActivitySurveyState( registry, {
				expirableItems: {
					[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]: ACTIVE,
					[ RECENT_ACTIVITY_TAB_OPENED_TIMER.slug ]: ACTIVE,
				},
			} );
			provideLatestPost( registry, RECENT_POST );
			mockVisit( 1 );

			const { waitForRegistry } = render();
			await waitForRegistry();
			await waitForDefaultTimeouts();

			expect( triggeredIDs() ).toEqual( [] );
		} );
	} );

	describe( 'zero interaction', () => {
		it( 'should trigger the survey when the latest post was published 7 days or less before the reference date', async () => {
			provideRecentActivitySurveyState( registry, {
				expirableItems: {
					[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]: ACTIVE,
				},
			} );
			provideLatestPost( registry, RECENT_POST );
			mockVisit( 1 );

			const { waitForRegistry } = render();
			await waitForRegistry();

			await waitFor( () =>
				expect( triggeredIDs() ).toEqual( [
					RECENT_ACTIVITY_SURVEY_TRIGGER_ZERO_INTERACTION,
				] )
			);
		} );

		it( 'should trigger the survey on the third visit when the "tab available" timer has 4 days or less left', async () => {
			provideRecentActivitySurveyState( registry, {
				expirableItems: {
					[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]:
						getExpiryFromNow( 4 * DAY_IN_SECONDS ),
				},
				dismissedPrompts: {
					[ TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG ]: {
						expires: 0,
						count: 2,
					},
				},
			} );
			provideLatestPost( registry );
			mockVisit( 3 );

			const { waitForRegistry } = render();
			await waitForRegistry();

			await waitFor( () =>
				expect( triggeredIDs() ).toEqual( [
					RECENT_ACTIVITY_SURVEY_TRIGGER_ZERO_INTERACTION,
				] )
			);
		} );

		it( 'should not trigger any survey on the second visit', async () => {
			provideRecentActivitySurveyState( registry, {
				expirableItems: {
					[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]:
						getExpiryFromNow( DAY_IN_SECONDS ),
				},
				dismissedPrompts: {
					[ TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG ]: {
						expires: 0,
						count: 1,
					},
				},
			} );
			provideLatestPost( registry );
			mockVisit( 2 );

			const { waitForRegistry } = render();
			await waitForRegistry();
			await waitForDefaultTimeouts();

			expect( triggeredIDs() ).toEqual( [] );
		} );
	} );

	it( 'should not trigger any survey, count a visit or start a timer when disabled', async () => {
		provideRecentActivitySurveyState( registry, {
			expirableItems: {
				[ RECENT_ACTIVITY_INTERACTION_TIMER.slug ]: EXPIRED,
			},
		} );
		mockVisit( 1 );

		render( { isEnabled: false } );
		await waitForDefaultTimeouts();

		expect( triggeredIDs() ).toEqual( [] );
		expect( fetchMock ).not.toHaveFetched( dismissPromptEndpoint );
		expect( fetchMock ).not.toHaveFetched( setExpirableItemTimersEndpoint );
	} );

	it( 'should not trigger any survey while the expirable items load', async () => {
		freezeFetch(
			new RegExp( '^/google-site-kit/v1/core/user/data/expirable-items' )
		);
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		provideLatestPost( registry, RECENT_POST );
		mockVisit( 1 );

		render();
		await waitForDefaultTimeouts();

		expect( triggeredIDs() ).toEqual( [] );
	} );

	it( 'should not trigger any survey while the latest post loads', async () => {
		provideRecentActivitySurveyState( registry, {
			expirableItems: {
				[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]: ACTIVE,
			},
		} );
		provideIncludeProductsState( registry, { wooCommerceActive: false } );
		freezeFetch( new RegExp( '^/wp/v2/posts' ) );
		mockVisit( 1 );

		render();
		await waitForDefaultTimeouts();

		expect( triggeredIDs() ).toEqual( [] );
	} );

	it( 'should not count a visit or trigger any survey before the widget has been in view', async () => {
		provideRecentActivitySurveyState( registry, {
			expirableItems: {
				[ RECENT_ACTIVITY_INTERACTION_TIMER.slug ]: EXPIRED,
			},
		} );
		mockVisit( 1 );

		const { waitForRegistry } = render( { hasBeenInView: false } );
		await waitForRegistry();
		await waitForDefaultTimeouts();

		expect( triggeredIDs() ).toEqual( [] );
		expect( fetchMock ).not.toHaveFetched( dismissPromptEndpoint );
	} );

	it( 'should count one visit per page load, once the widget has been in view', async () => {
		provideRecentActivitySurveyState( registry, {
			expirableItems: {
				[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]: ACTIVE,
			},
		} );
		provideLatestPost( registry );
		mockVisit( 1 );

		const { rerender, waitForRegistry } = render( {
			hasBeenInView: false,
		} );
		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( dismissPromptEndpoint );

		rerender( { isEnabled: true, hasBeenInView: true } );
		await waitForRegistry();

		rerender( { isEnabled: false, hasBeenInView: true } );
		rerender( { isEnabled: true, hasBeenInView: true } );
		await waitForRegistry();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( dismissPromptEndpoint )
		);

		expect( fetchMock ).toHaveFetchedTimes( 1, dismissPromptEndpoint );
		expect( fetchMock ).toHaveFetched( dismissPromptEndpoint, {
			body: {
				data: {
					slug: TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG,
					expiration: 0,
				},
			},
		} );
	} );

	it.each( [
		[ 'active', ACTIVE ],
		[ 'expired', EXPIRED ],
	] )(
		'should not count a visit when the user has opened the tab, with the "tab opened" timer %s',
		async ( _state, tabOpenedExpiry ) => {
			provideRecentActivitySurveyState( registry, {
				expirableItems: {
					[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]: ACTIVE,
					[ RECENT_ACTIVITY_TAB_OPENED_TIMER.slug ]: tabOpenedExpiry,
					[ RECENT_ACTIVITY_INTERACTION_TIMER.slug ]: ACTIVE,
				},
			} );
			mockVisit( 1 );

			const { waitForRegistry } = render();
			await waitForRegistry();
			await waitForDefaultTimeouts();

			expect( fetchMock ).not.toHaveFetched( dismissPromptEndpoint );
		}
	);

	it( 'should not count a visit once the count has reached 3', async () => {
		provideRecentActivitySurveyState( registry, {
			expirableItems: {
				[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]: ACTIVE,
			},
			dismissedPrompts: {
				[ TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG ]: {
					expires: 0,
					count: 3,
				},
			},
		} );
		provideLatestPost( registry );
		mockVisit( 4 );

		const { waitForRegistry } = render();
		await waitForRegistry();
		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( dismissPromptEndpoint );
	} );

	it.each( [
		[
			'expirable items',
			'^/google-site-kit/v1/core/user/data/expirable-items',
			() =>
				registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} ),
		],
		[
			'dismissed prompts',
			'^/google-site-kit/v1/core/user/data/dismissed-prompts',
			() =>
				registry.dispatch( CORE_USER ).receiveGetExpirableItems( {
					[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]: ACTIVE,
				} ),
		],
	] )(
		'should not count a visit when the %s fail to load',
		async ( _name, failingEndpoint, provideOtherState ) => {
			provideOtherState();
			fetchMock.get( new RegExp( failingEndpoint ), {
				body: { code: 'internal_server_error', message: 'Error' },
				status: 500,
			} );
			provideLatestPost( registry );
			mockVisit( 1 );

			const { waitForRegistry } = render();
			await waitForRegistry();
			await waitForDefaultTimeouts();

			expect( console ).toHaveErrored();
			expect( fetchMock ).not.toHaveFetched( dismissPromptEndpoint );
		}
	);

	it( 'should start the "tab available" timer for 14 days when the user does not have it', async () => {
		provideRecentActivitySurveyState( registry );
		provideLatestPost( registry );
		mockVisit( 1 );

		const { waitForRegistry } = render();
		await waitForRegistry();

		await waitFor( () =>
			expect( timerRequests() ).toEqual( [
				[
					{
						slug: RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug,
						expiration: 14 * DAY_IN_SECONDS,
					},
				],
			] )
		);
	} );

	it( 'should not restart the "tab available" timer when the user has it', async () => {
		provideRecentActivitySurveyState( registry, {
			expirableItems: {
				[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]: ACTIVE,
			},
		} );
		provideLatestPost( registry );
		mockVisit( 1 );

		const { waitForRegistry } = render();
		await waitForRegistry();
		await waitForDefaultTimeouts();

		expect( timerRequests() ).toEqual( [] );
	} );
} );
