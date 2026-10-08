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
import { VoteDirection } from './constants';
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

	it( 'should show the thank-you message and close button on vote without options', async () => {
		mockSurveyTrigger();

		const { getByRole, findByText } = render(
			<ThumbsSurveyTrigger voteID="ack_down" />,
			{ registry }
		);

		fireEvent.click(
			getByRole( 'button', { name: 'No, this was not helpful' } )
		);

		expect(
			await findByText( 'Thanks for the feedback!' )
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Close feedback message' } )
		).toBeInTheDocument();
	} );

	it( 'should intercept Escape inside the thumb controls only while the Popper is open', () => {
		jest.spyOn(
			registry.dispatch( CORE_USER ),
			'triggerSurvey'
		).mockResolvedValue( {} );

		const { getByRole, queryByRole } = render(
			<ThumbsSurveyTrigger voteID="escape" />,
			{ registry }
		);

		const thumb = getByRole( 'button', { name: 'Yes, this was helpful' } );

		const onWindowKeyDown = jest.fn();

		global.window.addEventListener( 'keydown', onWindowKeyDown );

		fireEvent.click( thumb );

		expect( getByRole( 'status' ) ).toBeInTheDocument();

		fireEvent.keyDown( thumb, { key: 'Tab' } );

		expect( getByRole( 'status' ) ).toBeInTheDocument();
		expect( onWindowKeyDown ).toHaveBeenCalledTimes( 1 );

		onWindowKeyDown.mockClear();

		fireEvent.keyDown( thumb, { key: 'Escape' } );

		expect( queryByRole( 'status' ) ).not.toBeInTheDocument();
		expect( onWindowKeyDown ).not.toHaveBeenCalled();

		fireEvent.keyDown( thumb, { key: 'Escape' } );

		expect( onWindowKeyDown ).toHaveBeenCalledTimes( 1 );

		global.window.removeEventListener( 'keydown', onWindowKeyDown );
	} );

	it.each< VoteDirection >( [ 'up', 'down' ] )(
		'should select the controlled %s vote without showing feedback',
		( voteDirection ) => {
			const { getByRole, queryByText } = render(
				<ThumbsSurveyTrigger
					voteID="initial"
					voteDirection={ voteDirection }
				/>,
				{ registry }
			);
			expect(
				getByRole( 'button', {
					name:
						voteDirection === 'up'
							? 'Yes, this was helpful'
							: 'No, this was not helpful',
				} )
			).toHaveAttribute( 'aria-pressed', 'true' );

			expect(
				queryByText( 'Thanks for the feedback!' )
			).not.toBeInTheDocument();

			expect( fetchMock ).not.toHaveFetched();
		}
	);

	it( 'should reflect changes to the controlled vote, including clearing it', () => {
		const { getByRole, rerender } = render(
			<ThumbsSurveyTrigger voteID="controlled" voteDirection={ null } />,
			{ registry }
		);

		const upButton = getByRole( 'button', {
			name: 'Yes, this was helpful',
		} );

		const downButton = getByRole( 'button', {
			name: 'No, this was not helpful',
		} );

		for ( const direction of [ 'up', 'down', null ] as const ) {
			rerender(
				<ThumbsSurveyTrigger
					voteID="controlled"
					voteDirection={ direction }
				/>
			);

			expect( upButton ).toHaveAttribute(
				'aria-pressed',
				String( direction === 'up' )
			);

			expect( downButton ).toHaveAttribute(
				'aria-pressed',
				String( direction === 'down' )
			);
		}
	} );

	it( 'should request a controlled vote change and open its feedback without changing the selection', async () => {
		mockSurveyTrigger();

		const onVote = jest.fn();

		const { getByRole, waitForRegistry } = render(
			<ThumbsSurveyTrigger
				voteID="controlled"
				voteDirection={ null }
				onVote={ onVote }
				feedbackOptions={ {
					down: [
						{ id: 'reason', label: 'A reason', value: 'reason' },
					],
				} }
			/>,
			{ registry }
		);

		const downButton = getByRole( 'button', {
			name: 'No, this was not helpful',
		} );

		fireEvent.click( downButton );

		expect( onVote ).toHaveBeenCalledWith( 'down' );
		expect( downButton ).toHaveAttribute( 'aria-pressed', 'false' );
		expect( downButton ).toHaveAttribute( 'aria-expanded', 'true' );

		expect(
			getByRole( 'menuitem', { name: 'A reason' } )
		).toBeInTheDocument();

		await waitForRegistry();
	} );

	it.each< VoteDirection >( [ 'up', 'down' ] )(
		'should request feedback on %s and show confirmation only after selection',
		async ( direction ) => {
			mockSurveyTrigger();

			const onSelectFeedback = jest.fn();

			const { getByRole, queryByRole, queryByText, findByText } = render(
				<ThumbsSurveyTrigger
					voteID="feedback"
					feedbackOptions={ {
						[ direction ]: [
							{
								id: 'reason',
								label: 'A reason',
								value: 'feedback-value',
							},
						],
					} }
					onSelectFeedback={ onSelectFeedback }
				/>,
				{ registry }
			);

			fireEvent.click(
				getByRole( 'button', {
					name:
						direction === 'up'
							? 'No, this was not helpful'
							: 'Yes, this was helpful',
				} )
			);

			expect(
				await findByText( 'Thanks for the feedback!' )
			).toBeInTheDocument();

			const button = getByRole( 'button', {
				name:
					direction === 'up'
						? 'Yes, this was helpful'
						: 'No, this was not helpful',
			} );

			fireEvent.click( button );

			expect( button ).toHaveAttribute( 'aria-expanded', 'true' );
			expect( button ).toHaveAttribute(
				'aria-controls',
				getByRole( 'menu' ).id
			);

			expect(
				queryByText( 'Thanks for the feedback!' )
			).not.toBeInTheDocument();

			fireEvent.click( getByRole( 'menuitem', { name: 'A reason' } ) );

			expect(
				await findByText( 'Thanks for the feedback!' )
			).toBeInTheDocument();

			expect( onSelectFeedback ).toHaveBeenCalledWith( 'feedback-value' );
			expect( queryByRole( 'menu' ) ).not.toBeInTheDocument();
			expect( button ).toHaveAttribute( 'aria-expanded', 'false' );
		}
	);

	it( 'should confirm immediately for an empty feedback option list', async () => {
		mockSurveyTrigger();
		const { getByRole, findByText } = render(
			<ThumbsSurveyTrigger
				voteID="empty"
				feedbackOptions={ { down: [] } }
			/>,
			{ registry }
		);

		fireEvent.click(
			getByRole( 'button', { name: 'No, this was not helpful' } )
		);

		expect(
			await findByText( 'Thanks for the feedback!' )
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
