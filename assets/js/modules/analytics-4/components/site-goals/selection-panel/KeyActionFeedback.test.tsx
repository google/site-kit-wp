/**
 * KeyActionFeedback component tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import * as tracking from '@/js/util/tracking';
import { feedbackEndpoint } from '@tests/js/mock-feedback-endpoint';
import {
	createTestRegistry,
	fireEvent,
	provideUserCapabilities,
	render,
	waitFor,
} from '@tests/js/test-utils';
import KeyActionFeedback from './KeyActionFeedback';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'KeyActionFeedback', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserCapabilities( registry );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.CONTACT,
			] );

		fetchMock.post( feedbackEndpoint, {
			status: 200,
			body: { success: true },
		} );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should open the "Help us improve" menu below the thumbs, so the panel can scroll to it', async () => {
		const { getByRole, waitForRegistry } = render(
			<KeyActionFeedback goalType={ GOAL_TYPES.ECOMMERCE } />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		fireEvent.click(
			getByRole( 'button', { name: 'Yes, this was helpful' } )
		);

		expect(
			getByRole( 'menu' ).closest( '.googlesitekit-feedback-menu' )
		).toHaveClass( 'googlesitekit-feedback-menu--bottom-end' );

		await waitForRegistry();
	} );

	it.each< [ GoalType, string, string ] >( [
		[
			GOAL_TYPES.ECOMMERCE,
			'site_goals_primary_action_panel_online_store',
			ENUM_CONVERSION_EVENTS.PURCHASE,
		],
		[
			GOAL_TYPES.LEAD,
			'site_goals_primary_action_panel_lead_generation',
			ENUM_CONVERSION_EVENTS.CONTACT,
		],
	] )(
		'should send and track the vote for the %s goal with the `%s` group and the `%s` Key action',
		async ( goalType, group, eventSlug ) => {
			const { getByRole, waitForRegistry } = render(
				<KeyActionFeedback goalType={ goalType } />,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			fireEvent.click(
				getByRole( 'button', { name: 'Yes, this was helpful' } )
			);

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_site-goals-key-action-survey',
				'vote_up',
				eventSlug
			);

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched( feedbackEndpoint, {
					body: {
						data: {
							namespace: 'analytics',
							group,
							key: 'vote',
							value: 'up',
						},
					},
				} )
			);

			await waitForRegistry();
		}
	);

	describe.each( [
		[
			'Yes, this was helpful',
			'up',
			[
				[ 'It’s what matters most', 'matters_most' ],
				[ 'Only some of them matter', 'only_some_matter' ],
				[ 'Other actions matter too', 'other_actions_matter' ],
			],
		],
		[
			'No, this was not helpful',
			'down',
			[
				[ 'Some are missing or wrong', 'missing_or_wrong' ],
				[ 'People call or email instead', 'call_or_email_instead' ],
				[
					'Something else matters more',
					'something_else_matters_more',
				],
			],
		],
	] )( 'after clicking "%s"', ( buttonName, direction, reasons ) => {
		it( 'should send and track the vote, and open the "Help us improve" menu with the reasons for that vote', async () => {
			const { getByRole, getAllByRole, waitForRegistry } = render(
				<KeyActionFeedback goalType={ GOAL_TYPES.ECOMMERCE } />,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			fireEvent.click( getByRole( 'button', { name: buttonName } ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_site-goals-key-action-survey',
				`vote_${ direction }`,
				ENUM_CONVERSION_EVENTS.PURCHASE
			);

			expect(
				getByRole( 'heading', { name: 'Help us improve' } )
			).toBeInTheDocument();
			expect(
				getAllByRole( 'menuitem' ).map( ( item ) => item.textContent )
			).toEqual( reasons.map( ( [ label ] ) => label ) );

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched( feedbackEndpoint, {
					body: {
						data: {
							namespace: 'analytics',
							group: 'site_goals_primary_action_panel_online_store',
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
					<KeyActionFeedback goalType={ GOAL_TYPES.ECOMMERCE } />,
					{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
				);

				fireEvent.click( getByRole( 'button', { name: buttonName } ) );

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
								group: 'site_goals_primary_action_panel_online_store',
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
