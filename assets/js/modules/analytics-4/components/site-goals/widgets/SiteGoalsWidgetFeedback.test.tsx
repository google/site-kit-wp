/**
 * SiteGoalsWidgetFeedback component tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import * as tracking from '@/js/util/tracking';
import { feedbackEndpoint } from '@tests/js/mock-feedback-endpoint';
import {
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import SiteGoalsWidgetFeedback from './SiteGoalsWidgetFeedback';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

const UPVOTE_REASONS = [
	[
		'Shows me which traffic actually drives results',
		'shows_what_drives_results',
	],
	[
		'Clear visibility into which channels are working for me',
		'clear_channel_visibility',
	],
	[ 'Easy to understand at a glance', 'easy_to_understand' ],
];

const DOWNVOTE_REASONS = [
	[ 'It’s missing the metrics I track / care about', 'missing_metrics' ],
	[ 'Numbers are wrong or out of date', 'numbers_wrong' ],
	[ 'I don’t understand what a metric means', 'metric_unclear' ],
];

describe( 'SiteGoalsWidgetFeedback', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();

		fetchMock.post( feedbackEndpoint, {
			status: 200,
			body: { success: true },
		} );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	describe.each< [ GoalType, string ] >( [
		[ GOAL_TYPES.ECOMMERCE, 'site_goals_widget_online_store' ],
		[ GOAL_TYPES.LEAD, 'site_goals_widget_lead_generation' ],
	] )( 'for the %s goal', ( goalType, group ) => {
		describe.each( [
			[ 'Yes, this was helpful', 'up', UPVOTE_REASONS ],
			[ 'No, this was not helpful', 'down', DOWNVOTE_REASONS ],
		] )( 'after clicking "%s"', ( buttonName, direction, reasons ) => {
			it( 'should send and track the vote, and open the "Help us improve" menu with the reasons for that vote', async () => {
				const { getByRole, getAllByRole, waitForRegistry } = render(
					<SiteGoalsWidgetFeedback goalType={ goalType } />,
					{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
				);

				fireEvent.click( getByRole( 'button', { name: buttonName } ) );

				expect( mockTrackEvent ).toHaveBeenCalledWith(
					'mainDashboard_site-goals-widget-survey',
					`vote_${ direction }`,
					goalType
				);

				expect(
					getByRole( 'heading', { name: 'Help us improve' } )
				).toBeInTheDocument();
				expect(
					getAllByRole( 'menuitem' ).map(
						( item ) => item.textContent
					)
				).toEqual( reasons.map( ( [ label ] ) => label ) );

				await waitFor( () =>
					expect( fetchMock ).toHaveFetched( feedbackEndpoint, {
						body: {
							data: {
								namespace: 'analytics',
								group,
								key: 'vote',
								value: direction,
							},
						},
					} )
				);

				await waitForRegistry();
			} );

			it.each( reasons )(
				'should send the "%s" reason as `%s` without a GA event',
				async ( label, value ) => {
					const { getByRole, findByText } = render(
						<SiteGoalsWidgetFeedback goalType={ goalType } />,
						{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
					);

					fireEvent.click(
						getByRole( 'button', { name: buttonName } )
					);

					mockTrackEvent.mockClear();

					fireEvent.click( getByRole( 'menuitem', { name: label } ) );

					expect(
						await findByText( 'Thanks for the feedback!' )
					).toBeInTheDocument();

					await waitFor( () =>
						expect( fetchMock ).toHaveFetched( feedbackEndpoint, {
							body: {
								data: {
									namespace: 'analytics',
									group,
									key: 'vote_reason',
									value,
								},
							},
						} )
					);

					expect( mockTrackEvent ).not.toHaveBeenCalled();
				}
			);
		} );
	} );
} );
