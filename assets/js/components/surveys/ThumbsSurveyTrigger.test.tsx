/**
 * ThumbsSurveyTrigger component tests.
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
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { surveyTriggerEndpoint } from '../../../../tests/js/mock-survey-endpoints';
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
} from '../../../../tests/js/test-utils';
import ThumbsSurveyTrigger from './ThumbsSurveyTrigger';

function mockSurveyTrigger() {
	fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );
}

describe( 'ThumbsSurveyTrigger', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
	} );

	it( 'renders the up and down buttons with accessible labels', () => {
		const { getByRole } = render(
			<ThumbsSurveyTrigger voteID="site_goals_widget_online_store" />,
			{ registry }
		);

		expect(
			getByRole( 'button', { name: 'Yes, this was helpful' } )
		).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'No, this was not helpful' } )
		).toBeInTheDocument();
	} );

	it( 'dispatches triggerSurvey with the up payload on thumbs-up click', async () => {
		mockSurveyTrigger();

		const { getByRole } = render(
			<ThumbsSurveyTrigger voteID="site_goals_widget_online_store" />,
			{ registry }
		);

		fireEvent.click(
			getByRole( 'button', { name: 'Yes, this was helpful' } )
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: {
						triggerID: 'vote:site_goals_widget_online_store:up',
					},
				},
			} )
		);
	} );

	it( 'dispatches triggerSurvey with the down payload on thumbs-down click', async () => {
		mockSurveyTrigger();

		const { getByRole } = render(
			<ThumbsSurveyTrigger voteID="site_goals_widget_lead_generation" />,
			{ registry }
		);

		fireEvent.click(
			getByRole( 'button', { name: 'No, this was not helpful' } )
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: {
						triggerID:
							'vote:site_goals_widget_lead_generation:down',
					},
				},
			} )
		);
	} );

	it( 'dispatches triggerSurvey on every click', async () => {
		mockSurveyTrigger();

		const { getByRole } = render(
			<ThumbsSurveyTrigger voteID="repeat_vote" />,
			{ registry }
		);

		const upButton = getByRole( 'button', {
			name: 'Yes, this was helpful',
		} );
		const downButton = getByRole( 'button', {
			name: 'No, this was not helpful',
		} );

		fireEvent.click( upButton );
		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint )
		);

		fireEvent.click( upButton );
		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes( 2, surveyTriggerEndpoint )
		);

		fireEvent.click( downButton );
		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes( 3, surveyTriggerEndpoint )
		);
	} );

	it( 'marks the clicked thumb as active via aria-pressed', async () => {
		mockSurveyTrigger();

		const { getByRole } = render(
			<ThumbsSurveyTrigger voteID="active_vote" />,
			{ registry }
		);

		const upButton = getByRole( 'button', {
			name: 'Yes, this was helpful',
		} );
		const downButton = getByRole( 'button', {
			name: 'No, this was not helpful',
		} );

		expect( upButton ).toHaveAttribute( 'aria-pressed', 'false' );
		expect( downButton ).toHaveAttribute( 'aria-pressed', 'false' );

		fireEvent.click( upButton );

		expect( upButton ).toHaveAttribute( 'aria-pressed', 'true' );
		expect( downButton ).toHaveAttribute( 'aria-pressed', 'false' );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint )
		);

		fireEvent.click( downButton );

		expect( upButton ).toHaveAttribute( 'aria-pressed', 'false' );
		expect( downButton ).toHaveAttribute( 'aria-pressed', 'true' );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes( 2, surveyTriggerEndpoint )
		);
	} );

	it( 'shows the thank-you message on thumbs-up click', async () => {
		mockSurveyTrigger();

		const { getByRole, findByText } = render(
			<ThumbsSurveyTrigger voteID="ack_up" />,
			{ registry }
		);

		fireEvent.click(
			getByRole( 'button', { name: 'Yes, this was helpful' } )
		);

		const ack = await findByText( 'Thanks for the feedback!' );
		expect( ack ).toBeInTheDocument();
	} );

	it( 'shows the downvote thank-you message with the "Tell us more" link and close button', async () => {
		mockSurveyTrigger();

		const { getByRole, findByRole } = render(
			<ThumbsSurveyTrigger
				voteID="ack_down"
				downvoteFormURL="https://example.com/form"
			/>,
			{ registry }
		);

		fireEvent.click(
			getByRole( 'button', { name: 'No, this was not helpful' } )
		);

		const link = await findByRole( 'link', { name: 'Tell us more' } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/form' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noreferrer noopener' );
		expect(
			await findByRole( 'button', {
				name: 'Close feedback message',
			} )
		).toBeInTheDocument();
	} );

	it( 'dismisses via the close button and reopens on the next vote', async () => {
		mockSurveyTrigger();

		const { getByRole, findByRole, queryByText, findByText } = render(
			<ThumbsSurveyTrigger voteID="dismiss_vote" />,
			{ registry }
		);

		fireEvent.click(
			getByRole( 'button', { name: 'Yes, this was helpful' } )
		);

		await findByText( 'Thanks for the feedback!' );

		const close = await findByRole( 'button', {
			name: 'Close feedback message',
		} );
		fireEvent.click( close );

		await waitFor( () =>
			expect(
				queryByText( 'Thanks for the feedback!' )
			).not.toBeInTheDocument()
		);

		fireEvent.click(
			getByRole( 'button', { name: 'No, this was not helpful' } )
		);

		expect(
			await findByText( /Thanks for the feedback!/ )
		).toBeInTheDocument();
	} );

	it( 'calls the optional onVote callback with the clicked direction', () => {
		mockSurveyTrigger();
		const onVote = jest.fn();

		const { getByRole } = render(
			<ThumbsSurveyTrigger voteID="callback_vote" onVote={ onVote } />,
			{ registry }
		);

		fireEvent.click(
			getByRole( 'button', { name: 'Yes, this was helpful' } )
		);
		fireEvent.click(
			getByRole( 'button', { name: 'No, this was not helpful' } )
		);

		expect( onVote ).toHaveBeenNthCalledWith( 1, 'up' );
		expect( onVote ).toHaveBeenNthCalledWith( 2, 'down' );
	} );
} );
