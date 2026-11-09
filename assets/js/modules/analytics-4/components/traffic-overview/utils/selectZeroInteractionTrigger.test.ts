/**
 * Traffic Overview `selectZeroInteractionTrigger` utility tests.
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
import { Select } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	LATEST_POST_RECENT_CONTENT_OPTIONS,
	RECENT_ACTIVITY_SURVEY_TRIGGER_ZERO_INTERACTION,
	RECENT_ACTIVITY_TAB_AVAILABLE_TIMER,
	TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	LATEST_POST,
	getExpiryFromNow,
	provideLatestPost,
	provideRecentActivitySurveyState,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import {
	provideIncludeProductsState,
	provideRecentContent,
} from '@/js/modules/analytics-4/datastore/test-utils';
import { DAY_IN_SECONDS } from '@/js/util/dates';
import { dismissedPromptsEndpoint } from '@tests/js/mock-dismiss-prompt-endpoints';
import { createTestRegistry, waitFor } from '@tests/js/test-utils';
import { freezeFetch } from '@tests/js/utils';
import { selectZeroInteractionTrigger } from './selectZeroInteractionTrigger';

describe( 'selectZeroInteractionTrigger', () => {
	const REFERENCE_DATE = '2026-10-01';

	// `LATEST_POST` was published 14 days before the reference date.
	// Published 7 days before the reference date.
	const RECENT_POST = { ...LATEST_POST, publishedAt: '2026-09-24T12:30:00Z' };

	const expirableItemsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/expirable-items'
	);
	const postsEndpoint = new RegExp( '^/wp/v2/posts' );

	let registry: WPDataRegistry;

	function visitCount( count: number ) {
		return {
			[ TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG ]: { expires: 0, count },
		};
	}

	function select() {
		return selectZeroInteractionTrigger( registry.select as Select );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( REFERENCE_DATE );
	} );

	it( 'should select the trigger when the latest post was published 7 days or less before the reference date', () => {
		provideLatestPost( registry, RECENT_POST );

		expect( select() ).toBe(
			RECENT_ACTIVITY_SURVEY_TRIGGER_ZERO_INTERACTION
		);
	} );

	it( 'should select the trigger from the third visit when the "tab available" timer has 4 days or less left', () => {
		provideLatestPost( registry );
		provideRecentActivitySurveyState( registry, {
			expirableItems: {
				[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]: getExpiryFromNow(
					4 * DAY_IN_SECONDS
				),
			},
			dismissedPrompts: visitCount( 3 ),
		} );

		expect( select() ).toBe(
			RECENT_ACTIVITY_SURVEY_TRIGGER_ZERO_INTERACTION
		);
	} );

	it.each( [
		[ 'before the third visit', 2, 4 * DAY_IN_SECONDS ],
		[
			'when the "tab available" timer has more than 4 days left',
			3,
			5 * DAY_IN_SECONDS,
		],
		[ 'when the "tab available" timer has expired', 3, -DAY_IN_SECONDS ],
	] )(
		'should select no trigger %s',
		( _description, count, secondsLeft ) => {
			provideLatestPost( registry );
			provideRecentActivitySurveyState( registry, {
				expirableItems: {
					[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]:
						getExpiryFromNow( secondsLeft ),
				},
				dismissedPrompts: visitCount( count ),
			} );

			expect( select() ).toBeUndefined();
		}
	);

	it( 'should select no trigger when the user does not have the "tab available" timer', () => {
		provideLatestPost( registry );
		provideRecentActivitySurveyState( registry, {
			dismissedPrompts: visitCount( 3 ),
		} );

		expect( select() ).toBeUndefined();
	} );

	it( 'should select no trigger when the site has no published posts', () => {
		provideRecentContent(
			registry,
			[],
			LATEST_POST_RECENT_CONTENT_OPTIONS
		);

		expect( select() ).toBeUndefined();
	} );

	it( 'should return `null` while the latest post loads', async () => {
		provideIncludeProductsState( registry, { wooCommerceActive: false } );
		freezeFetch( postsEndpoint );

		expect( select() ).toBeNull();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( postsEndpoint )
		);
	} );

	it( 'should return `null` while the dismissed prompts load', async () => {
		provideLatestPost( registry );

		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {
			[ RECENT_ACTIVITY_TAB_AVAILABLE_TIMER.slug ]: getExpiryFromNow(
				2 * DAY_IN_SECONDS
			),
		} );
		freezeFetch( dismissedPromptsEndpoint );

		expect( select() ).toBeNull();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( dismissedPromptsEndpoint )
		);
	} );

	it( 'should return `null` while the expirable items load', async () => {
		provideLatestPost( registry );
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedPrompts( visitCount( 3 ) );
		freezeFetch( expirableItemsEndpoint );

		expect( select() ).toBeNull();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( expirableItemsEndpoint )
		);
	} );
} );
