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
	TRAFFIC_CARD_VISIT_COUNT_PROMPT_SLUG,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	LATEST_POST,
	provideLatestPost,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import {
	provideIncludeProductsState,
	provideRecentContent,
} from '@/js/modules/analytics-4/datastore/test-utils';
import { dismissedPromptsEndpoint } from '@tests/js/mock-dismiss-prompt-endpoints';
import { createTestRegistry, waitFor } from '@tests/js/test-utils';
import { freezeFetch } from '@tests/js/utils';
import { selectZeroInteractionTrigger } from './selectZeroInteractionTrigger';

describe( 'selectZeroInteractionTrigger', () => {
	const REFERENCE_DATE = '2026-10-01';

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

	it( 'should select the trigger from the third visit, when the latest post was published 14 days before the reference date', () => {
		provideLatestPost( registry );
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedPrompts( visitCount( 3 ) );

		expect( select() ).toBe(
			RECENT_ACTIVITY_SURVEY_TRIGGER_ZERO_INTERACTION
		);
	} );

	it( 'should select no trigger before the third visit, even when the latest post was published on the reference date', () => {
		provideLatestPost( registry, {
			...LATEST_POST,
			publishedAt: '2026-10-01T12:30:00Z',
		} );
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedPrompts( visitCount( 2 ) );

		expect( select() ).toBeUndefined();
	} );

	it( 'should select no trigger when the site has no published posts, even from the third visit', () => {
		provideRecentContent(
			registry,
			[],
			LATEST_POST_RECENT_CONTENT_OPTIONS
		);
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedPrompts( visitCount( 3 ) );

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
		freezeFetch( dismissedPromptsEndpoint );

		expect( select() ).toBeNull();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( dismissedPromptsEndpoint )
		);
	} );
} );
