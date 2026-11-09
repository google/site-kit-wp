/**
 * Recent activity latest post header tests.
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
import { preventNavigation } from '@/js/event-providers/content-events/test-utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { RECENT_ACTIVITY_INTERACTION_TIMER } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	LATEST_POST,
	provideRecentActivitySurveyState,
	setExpirableItemTimersEndpoint,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import * as tracking from '@/js/util/tracking';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import { provideSiteInfo, provideTimezone } from '@tests/js/utils';
import LatestPostHeader from './LatestPostHeader';

const ENTITY_DASHBOARD_URL =
	'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&permaLink=https%3A%2F%2Fexample.com%2Fice-cream%2F';

describe( 'LatestPostHeader', () => {
	let registry: WPDataRegistry;

	mockLocation();

	const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
	mockTrackEvent.mockImplementation( () => Promise.resolve() );

	beforeEach( () => {
		mockTrackEvent.mockClear();

		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideRecentActivitySurveyState( registry );
	} );

	const interactionTimerRequest = {
		body: {
			data: [
				{
					slug: RECENT_ACTIVITY_INTERACTION_TIMER.slug,
					expiration:
						RECENT_ACTIVITY_INTERACTION_TIMER.expiresInSeconds,
				},
			],
		},
	};

	it( 'should link the post title to the entity dashboard of the post', () => {
		const { getByRole } = render(
			<LatestPostHeader post={ LATEST_POST } />,
			{ registry }
		);

		expect(
			getByRole( 'link', { name: 'Ice cream is good for your health' } )
		).toHaveAttribute( 'href', ENTITY_DASHBOARD_URL );
	} );

	it( 'should track `click_post_link` labeled `latest-post-header` and record an interaction, then open the entity dashboard, when the post title is clicked', async () => {
		let resolveTrackEvent: ( () => void ) | undefined;
		mockTrackEvent.mockImplementationOnce(
			() =>
				new Promise( ( resolve ) => {
					resolveTrackEvent = resolve;
				} )
		);
		fetchMock.postOnce( setExpirableItemTimersEndpoint, {
			body: {},
			status: 200,
		} );

		const { getByRole } = render(
			<LatestPostHeader post={ LATEST_POST } />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		const notPrevented = fireEvent.click(
			getByRole( 'link', { name: 'Ice cream is good for your health' } )
		);

		expect( notPrevented ).toBe( false );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_recent-activity',
			'click_post_link',
			'latest-post-header'
		);
		// The page stays open until the event is sent.
		expect( global.location.assign ).not.toHaveBeenCalled();

		await act( async () => {
			resolveTrackEvent?.();
			await Promise.resolve();
		} );

		await waitFor( () =>
			expect( global.location.assign ).toHaveBeenCalledWith(
				ENTITY_DASHBOARD_URL
			)
		);
		expect( fetchMock ).toHaveFetched(
			setExpirableItemTimersEndpoint,
			interactionTimerRequest
		);
	} );

	it( 'should open the entity dashboard only once the interaction is saved', async () => {
		let resolveTimerRequest: ( () => void ) | undefined;
		fetchMock.postOnce(
			setExpirableItemTimersEndpoint,
			new Promise( ( resolve ) => {
				resolveTimerRequest = () =>
					resolve( { body: {}, status: 200 } );
			} )
		);

		const { getByRole } = render(
			<LatestPostHeader post={ LATEST_POST } />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		fireEvent.click(
			getByRole( 'link', { name: 'Ice cream is good for your health' } )
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( setExpirableItemTimersEndpoint )
		);
		expect( global.location.assign ).not.toHaveBeenCalled();

		await act( async () => {
			resolveTimerRequest?.();
			await new Promise( ( resolve ) => setTimeout( resolve ) );
		} );

		expect( global.location.assign ).toHaveBeenCalledWith(
			ENTITY_DASHBOARD_URL
		);
	} );

	it.each( [
		[ 'Command', { metaKey: true } ],
		[ 'Control', { ctrlKey: true } ],
	] )(
		'should track `click_post_link`, record an interaction and leave the click to the browser when the post title is clicked with %s held',
		async ( _key, modifiers ) => {
			fetchMock.postOnce( setExpirableItemTimersEndpoint, {
				body: {},
				status: 200,
			} );

			const { getByRole } = render(
				<LatestPostHeader post={ LATEST_POST } />,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			let wasPreventedByComponent: boolean | undefined;
			function recordAndPreventNavigation( event: Event ) {
				wasPreventedByComponent = event.defaultPrevented;
				// jsdom can't open the link in a new tab, so it would log
				// "Not implemented: navigation".
				preventNavigation( event );
			}

			global.document.addEventListener(
				'click',
				recordAndPreventNavigation
			);

			try {
				fireEvent.click(
					getByRole( 'link', {
						name: 'Ice cream is good for your health',
					} ),
					modifiers
				);
			} finally {
				global.document.removeEventListener(
					'click',
					recordAndPreventNavigation
				);
			}

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched(
					setExpirableItemTimersEndpoint,
					interactionTimerRequest
				)
			);
			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve ) )
			);

			expect( wasPreventedByComponent ).toBe( false );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_recent-activity',
				'click_post_link',
				'latest-post-header'
			);
			expect( global.location.assign ).not.toHaveBeenCalled();
		}
	);

	it( 'should show the publish date and time in the site time zone, without the year', () => {
		const { getByText } = render(
			<LatestPostHeader
				post={ {
					...LATEST_POST,
					publishedAt: '2026-07-14T18:30:00Z',
					sitePublishedAt: '2026-07-14T14:30:00',
				} }
			/>,
			{ registry }
		);

		expect(
			getByText( /^posted July 14 at 2:30\sPM$/ )
		).toBeInTheDocument();
	} );

	it( 'should show the publish time in the site time zone, rather than the browser time zone, when the site time zone is a UTC offset', () => {
		provideSiteInfo( registry, { timezone: '' } );
		// The browser is on UTC+8, so the browser time would be 3:59 PM.
		const originalTimezone = provideTimezone( 'Asia/Singapore' );

		try {
			const { getByText } = render(
				<LatestPostHeader
					post={ {
						...LATEST_POST,
						publishedAt: '2026-09-17T07:59:00Z',
						sitePublishedAt: '2026-09-17T07:59:00',
					} }
				/>,
				{ registry }
			);

			expect(
				getByText( /^posted September 17 at 7:59\sAM$/ )
			).toBeInTheDocument();
		} finally {
			provideTimezone( originalTimezone );
		}
	} );
} );
