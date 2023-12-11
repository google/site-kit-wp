/**
 * Survey component tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import {
	render,
	fireEvent,
	createTestRegistry,
	waitFor,
	provideCurrentSurvey,
} from '../../../../tests/js/test-utils';
import CurrentSurvey from './CurrentSurvey';
import {
	singleQuestionMultiSelect,
	singleQuestionOpenText,
	singleQuestionSurvey,
	singleQuestionSurveySingleSelect,
	multiQuestionSurvey,
	multiQuestionConditionalSurvey,
	invalidQuestionTypeSurvey,
} from './__fixtures__';

// Text input should only allow up to 200 characters of input.
const STRING_100_CHARACTERS =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec suscipit auctor dui, id faucibus nisl';
const STRING_200_CHARACTERS = STRING_100_CHARACTERS + STRING_100_CHARACTERS;

const STRING_210_CHARACTERS = `${ STRING_200_CHARACTERS } rhoncus n`;

describe( 'CurrentSurvey', () => {
	const surveyEventRegexp = new RegExp(
		'^/google-site-kit/v1/core/user/data/survey-event'
	);

	let registry;

	beforeEach( () => {
		fetchMock.post( surveyEventRegexp, { body: {} } );

		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetTracking( { enabled: true } );
	} );

	it( 'should render a survey when one exists in the datastore', () => {
		provideCurrentSurvey( registry );

		const { container } = render( <CurrentSurvey />, { registry } );

		expect( fetchMock ).toHaveFetched( surveyEventRegexp );
		expect( container ).toMatchSnapshot();
	} );

	it( "should render a rating question when the `question_type` is 'rating'", () => {
		provideCurrentSurvey( registry );

		const { container } = render( <CurrentSurvey />, { registry } );

		expect( fetchMock ).toHaveFetched( surveyEventRegexp );
		expect( container ).toMatchSnapshot();
	} );

	describe( "should render an open text question when the `question_type` is 'open_text'", () => {
		beforeEach( () => {
			provideCurrentSurvey( registry, singleQuestionOpenText );
		} );

		it( 'should display the question prompt and subtitle', () => {
			const { getByText } = render( <CurrentSurvey />, {
				registry,
			} );

			// Check the question's prompt is set by the `question_text` prop.
			expect(
				getByText( 'How satisfied are you with Site Kit?' )
			).toBeInTheDocument();

			// Check subtitle is set by subtitle prop.
			expect(
				getByText( 'Based on your experience so far, tell us.' )
			).toBeInTheDocument();
		} );

		it( 'should limit text input to 200 characters', () => {
			const { getByLabelText } = render( <CurrentSurvey />, {
				registry,
			} );

			fireEvent.change( getByLabelText( 'Write here' ), {
				target: { value: STRING_210_CHARACTERS },
			} );

			expect( getByLabelText( 'Write here' ) ).toHaveValue(
				STRING_200_CHARACTERS
			);
		} );

		it( 'should disable submit button when no text is entered', () => {
			const { getByLabelText, getByRole } = render( <CurrentSurvey />, {
				registry,
			} );

			// Submit button should be disabled if text input is empty.
			expect( getByRole( 'button', { name: 'Submit' } ) ).toHaveAttribute(
				'disabled'
			);

			fireEvent.change( getByLabelText( 'Write here' ), {
				target: { value: 'Foobar' },
			} );

			// Submit button should be enabled if text has been entered.
			expect(
				getByRole( 'button', { name: 'Submit' } )
			).not.toBeDisabled();

			// Clear and enter input again.
			fireEvent.change( getByLabelText( 'Write here' ), {
				target: { value: '' },
			} );
			expect( getByRole( 'button', { name: 'Submit' } ) ).toHaveAttribute(
				'disabled'
			);

			fireEvent.change( getByLabelText( 'Write here' ), {
				target: { value: 'Foobar' },
			} );
			expect(
				getByRole( 'button', { name: 'Submit' } )
			).not.toBeDisabled();
		} );

		it( 'should submit answer in correct shape', async () => {
			const { getByLabelText, getByRole, findByText } = render(
				<CurrentSurvey />,
				{
					registry,
				}
			);

			expect( fetchMock ).toHaveFetched( surveyEventRegexp );

			expect( fetchMock ).toHaveBeenCalledTimes( 1 );

			fireEvent.change( getByLabelText( 'Write here' ), {
				target: { value: 'Foobar' },
			} );

			fireEvent.click( getByRole( 'button', { name: 'Submit' } ) );

			expect( fetchMock ).toHaveBeenCalledTimes( 2 );

			expect( fetchMock ).toHaveFetched(
				'/google-site-kit/v1/core/user/data/survey-event?_locale=user',
				{
					body: {
						data: {
							event: {
								question_answered: {
									question_ordinal: 1,
									answer: {
										answer: 'Foobar',
									},
								},
							},
							session: {
								session_id: 'storybook_session',
								session_token: 'token_12345',
							},
						},
					},
					credentials: 'include',
					headers: {
						Accept: 'application/json, */*;q=0.1',
						'Content-Type': 'application/json',
					},
					method: 'POST',
				}
			);

			const completionMessage = await findByText(
				'Thanks for sharing your thoughts!'
			);

			expect( completionMessage ).toBeInTheDocument();
		} );
	} );

	describe( "should render a single select question when the `question_type` is 'single_select'", () => {
		beforeEach( () => {
			provideCurrentSurvey( registry, singleQuestionSurveySingleSelect );
		} );

		it( 'should disable the submit button when no option is selected', () => {
			const { getByText, getByRole } = render( <CurrentSurvey />, {
				registry,
			} );

			expect(
				getByText(
					'Based on your experience so far, how satisfied are you with Site Kit?'
				)
			).toBeInTheDocument();

			// The submit button should be disabled until an option is selected.
			expect( getByRole( 'button', { name: 'Submit' } ) ).toHaveAttribute(
				'disabled'
			);

			fireEvent.click( getByText( 'Unhappy' ) );

			expect(
				getByRole( 'button', { name: 'Submit' } )
			).not.toBeDisabled();
		} );

		it( 'should disable the "other" text input if "other" is not selected', () => {
			const { getByText, getByLabelText } = render( <CurrentSurvey />, {
				registry,
			} );

			expect(
				getByLabelText( 'Text input for option Other' )
			).toHaveAttribute( 'disabled' );

			// Once selected, the "other" text input should be enabled.
			fireEvent.click( getByText( 'Other' ) );

			expect(
				getByLabelText( 'Text input for option Other' )
			).not.toBeDisabled();

			// The text input should be disabled again if "other" is not selected.
			fireEvent.click( getByText( 'Satisfied' ) );

			expect(
				getByLabelText( 'Text input for option Other' )
			).toHaveAttribute( 'disabled' );
		} );

		it( 'should disable the submit button when "other" is selected but the user has not entered any text in the text input', () => {
			const { getByText, getByRole, getByLabelText } = render(
				<CurrentSurvey />,
				{
					registry,
				}
			);

			fireEvent.click( getByText( 'Other' ) );

			// The next/submit button should be disabled until text is entered.
			expect( getByRole( 'button', { name: 'Submit' } ) ).toHaveAttribute(
				'disabled'
			);

			// Enter text into the text input, which should cause the submit button
			// to be enabled.
			fireEvent.change( getByLabelText( 'Text input for option Other' ), {
				target: { value: 'foo' },
			} );

			expect(
				getByRole( 'button', { name: 'Submit' } )
			).not.toBeDisabled();
		} );

		it( 'should enforce a maxiumum text input length of 200 characters', () => {
			const { getByText, getByLabelText } = render( <CurrentSurvey />, {
				registry,
			} );

			fireEvent.click( getByText( 'Other' ) );

			fireEvent.change( getByLabelText( 'Text input for option Other' ), {
				target: { value: STRING_210_CHARACTERS },
			} );

			expect(
				getByLabelText( 'Text input for option Other' )
			).toHaveValue( STRING_200_CHARACTERS );
		} );

		it( 'should submit answer in correct shape', async () => {
			const { getByText, getByRole, getByLabelText, findByText } = render(
				<CurrentSurvey />,
				{
					registry,
				}
			);

			expect( fetchMock ).toHaveBeenCalledTimes( 1 );

			fireEvent.click( getByText( 'Other' ) );

			fireEvent.change( getByLabelText( 'Text input for option Other' ), {
				target: { value: 'My cool answer.' },
			} );

			// Check that submits correctly
			fireEvent.click( getByRole( 'button', { name: 'Submit' } ) );

			expect( fetchMock ).toHaveBeenCalledTimes( 2 );

			expect( fetchMock ).toHaveFetched(
				'/google-site-kit/v1/core/user/data/survey-event?_locale=user',
				{
					credentials: 'include',
					method: 'POST',
					body: {
						data: {
							event: {
								question_answered: {
									question_ordinal: 1,
									answer: {
										answer: {
											answer_ordinal: 6,
											answer_text: 'My cool answer.',
										},
									},
								},
							},
							session: {
								session_id: 'storybook_session',
								session_token: 'token_12345',
							},
						},
					},
					headers: {
						Accept: 'application/json, */*;q=0.1',
						'Content-Type': 'application/json',
					},
				}
			);

			const completionMessage = await findByText(
				'Thanks for sharing your thoughts!'
			);
			expect( completionMessage ).not.toBeEmptyDOMElement();
		} );
	} );

	describe( "should render a multi select question when the `question_type` is 'multi_select'", () => {
		beforeEach( () => {
			provideCurrentSurvey( registry, singleQuestionMultiSelect );
		} );

		it( 'should render the appropriate question', () => {
			const { getByText } = render( <CurrentSurvey />, {
				registry,
			} );

			expect(
				getByText( 'What are your favorite pizza toppings?' )
			).toBeInTheDocument();
		} );

		it( 'should disable the submit button when the number of options selected is less than `minChoices`', () => {
			const { getByText, getByRole } = render( <CurrentSurvey />, {
				registry,
			} );

			expect( fetchMock ).toHaveBeenCalledTimes( 1 );

			// The submit button should be disabled until two options are selected.
			expect( getByRole( 'button', { name: 'Submit' } ) ).toHaveAttribute(
				'disabled'
			);

			// Select the first item.
			fireEvent.click( getByText( 'Pepperoni' ) );

			expect( getByRole( 'button', { name: 'Submit' } ) ).toHaveAttribute(
				'disabled'
			);

			// Select the second item. This should enable the submit button.
			fireEvent.click( getByText( 'Sausage' ) );

			expect(
				getByRole( 'button', { name: 'Submit' } )
			).not.toBeDisabled();

			// Ensure the submit button is disabled again when the second item is
			// un-selected.
			fireEvent.click( getByText( 'Sausage' ) );

			expect( getByRole( 'button', { name: 'Submit' } ) ).toHaveAttribute(
				'disabled'
			);
		} );

		it( 'should disable other options once the number of options selected equals `maxChoices`', () => {
			const { getByLabelText, getByRole } = render( <CurrentSurvey />, {
				registry,
			} );

			// Five items selected is too high and shoud cause the sub, button to be
			// disabled.
			fireEvent.click( getByLabelText( 'Pepperoni' ) );
			fireEvent.click( getByLabelText( 'Sausage' ) );
			fireEvent.click( getByLabelText( 'Mushrooms' ) );

			// This option will be enabled because we still haven't selected the
			// maximum number of items.
			expect( getByLabelText( 'Sweetcorn' ) ).not.toBeDisabled();

			fireEvent.click( getByLabelText( 'Black Olives' ) );

			// The submit button should be active even when the maximum number of
			// items have been selected.
			expect(
				getByRole( 'button', { name: 'Submit' } )
			).not.toBeDisabled();

			// All unselected options should be disabled.
			expect( getByLabelText( 'Sweetcorn' ) ).toHaveAttribute(
				'disabled'
			);
			expect( getByLabelText( 'Other' ) ).toHaveAttribute( 'disabled' );

			// Existing selections should still be enabled, so the user can de-select
			// them.
			expect( getByLabelText( 'Pepperoni' ) ).not.toBeDisabled();
			expect( getByLabelText( 'Sausage' ) ).not.toBeDisabled();
			expect( getByLabelText( 'Mushrooms' ) ).not.toBeDisabled();
			expect( getByLabelText( 'Black Olives' ) ).not.toBeDisabled();

			// Removing a few selected items should enable other options again.
			fireEvent.click( getByLabelText( 'Mushrooms' ) );

			expect( getByLabelText( 'Sweetcorn' ) ).not.toBeDisabled();
		} );

		it( 'should disable "other" text input unless the "other" option is selected', () => {
			const { getByText, getByLabelText, getByRole } = render(
				<CurrentSurvey />,
				{
					registry,
				}
			);

			fireEvent.click( getByText( 'Pepperoni' ) );
			fireEvent.click( getByText( 'Sausage' ) );

			// Ensure the button is not disabled.
			expect(
				getByRole( 'button', { name: 'Submit' } )
			).not.toBeDisabled();

			// The text input should be disabled because "Other" is not selected.
			expect(
				getByLabelText( 'Text input for option Other' )
			).toHaveAttribute( 'disabled' );

			// Select "Other" and ensure the text input is enabled.
			fireEvent.click( getByText( 'Other' ) );

			expect(
				getByLabelText( 'Text input for option Other' )
			).not.toBeDisabled();

			// Ensure the input is disabled if "Other" is deselected.
			fireEvent.click( getByText( 'Other' ) );

			expect(
				getByLabelText( 'Text input for option Other' )
			).toHaveAttribute( 'disabled' );
		} );

		it( 'should disable the submit button when "other" is selected but the user has not entered any text in the text input', () => {
			const { getByText, getByLabelText, getByRole } = render(
				<CurrentSurvey />,
				{
					registry,
				}
			);

			fireEvent.click( getByText( 'Pepperoni' ) );
			fireEvent.click( getByText( 'Sausage' ) );
			fireEvent.click( getByText( 'Other' ) );

			// No text has been entered, so with "Other" selected, the submit button
			// should be disabled.
			expect( getByRole( 'button', { name: 'Submit' } ) ).toHaveAttribute(
				'disabled'
			);

			// Enter text, so the submit button should be enabled.
			fireEvent.change( getByLabelText( 'Text input for option Other' ), {
				target: { value: 'My answer' },
			} );

			expect(
				getByRole( 'button', { name: 'Submit' } )
			).not.toBeDisabled();
		} );

		it( 'should limit text input to 100 characters', () => {
			const { getByText, getByLabelText } = render( <CurrentSurvey />, {
				registry,
			} );

			fireEvent.click( getByText( 'Pepperoni' ) );
			fireEvent.click( getByText( 'Sausage' ) );
			fireEvent.click( getByText( 'Other' ) );

			// Check that text input limits input to 100 characters.
			fireEvent.change( getByLabelText( 'Text input for option Other' ), {
				target: { value: STRING_210_CHARACTERS },
			} );

			expect(
				getByLabelText( 'Text input for option Other' )
			).toHaveValue( STRING_200_CHARACTERS );
		} );

		it( 'should submit answer in correct shape', async () => {
			const { getByText, getByRole, getByLabelText, findByText } = render(
				<CurrentSurvey />,
				{
					registry,
				}
			);

			fireEvent.click( getByText( 'Other' ) );
			fireEvent.click( getByText( 'Pepperoni' ) );
			fireEvent.click( getByText( 'Sausage' ) );

			fireEvent.change( getByLabelText( 'Text input for option Other' ), {
				target: { value: 'My answer' },
			} );

			// Check that submits correctly.
			fireEvent.click( getByRole( 'button', { name: 'Submit' } ) );

			expect( fetchMock ).toHaveBeenCalledTimes( 2 );

			expect( fetchMock ).toHaveFetched(
				'/google-site-kit/v1/core/user/data/survey-event?_locale=user',
				{
					credentials: 'include',
					method: 'POST',
					body: {
						data: {
							event: {
								question_answered: {
									question_ordinal: 1,
									answer: {
										answer: [
											{ answer_ordinal: 1 },
											{ answer_ordinal: 3 },
											{
												answer_ordinal: 6,
												answer_text: 'My answer',
											},
										],
									},
								},
							},
							session: {
								session_id: 'storybook_session',
								session_token: 'token_12345',
							},
						},
					},
					headers: {
						Accept: 'application/json, */*;q=0.1',
						'Content-Type': 'application/json',
					},
				}
			);

			const completionMessage = await findByText(
				'Thanks for sharing your thoughts!'
			);

			expect( completionMessage ).toBeInTheDocument();
		} );
	} );

	it( 'should render nothing when the `question_type` is unknown', () => {
		provideCurrentSurvey( registry, invalidQuestionTypeSurvey );

		const { container } = render( <CurrentSurvey />, { registry } );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( "should send a 'survey_shown' event on mount", () => {
		provideCurrentSurvey( registry );

		const { rerender } = render( <CurrentSurvey />, { registry } );

		expect( fetchMock ).toHaveFetched(
			'/google-site-kit/v1/core/user/data/survey-event?_locale=user',
			{
				body: {
					data: {
						event: { survey_shown: {} },
						session: singleQuestionSurvey.session,
					},
				},
				credentials: 'include',
				headers: {
					Accept: 'application/json, */*;q=0.1',
					'Content-Type': 'application/json',
				},
				method: 'POST',
			}
		);

		fetchMock.resetHistory();

		// Render again to ensure we don't send another `survey_shown` event.
		rerender();

		expect( fetchMock ).not.toHaveFetched();
	} );

	it( "should send a 'question_answered' event when a question is answered", async () => {
		provideCurrentSurvey( registry );

		const { getByLabelText, findByText } = render( <CurrentSurvey />, {
			registry,
		} );

		fireEvent.click( getByLabelText( 'Delighted' ) );

		expect( fetchMock ).toHaveFetched(
			'/google-site-kit/v1/core/user/data/survey-event?_locale=user',
			{
				body: {
					data: {
						event: {
							question_answered: {
								question_ordinal: 1,
								answer: {
									answer: { answer_ordinal: 5 },
								},
							},
						},
						session: singleQuestionSurvey.session,
					},
				},
				credentials: 'include',
				headers: {
					Accept: 'application/json, */*;q=0.1',
					'Content-Type': 'application/json',
				},
				method: 'POST',
			}
		);

		await findByText( 'Thanks for sharing your thoughts!' );
	} );

	it( 'should advance to the next question when a question is answered in a multi-question survey', async () => {
		provideCurrentSurvey( registry, multiQuestionSurvey );

		const { getByLabelText, getByText, findByText } = render(
			<CurrentSurvey />,
			{ registry }
		);

		fireEvent.click( getByLabelText( 'Unhappy' ) );

		expect( fetchMock ).toHaveFetched(
			'/google-site-kit/v1/core/user/data/survey-event?_locale=user',
			{
				body: {
					data: {
						event: {
							question_answered: {
								question_ordinal: 1,
								answer: {
									answer: { answer_ordinal: 1 },
								},
							},
						},
						session: multiQuestionSurvey.session,
					},
				},
				credentials: 'include',
				headers: {
					Accept: 'application/json, */*;q=0.1',
					'Content-Type': 'application/json',
				},
				method: 'POST',
			}
		);

		await findByText( 'Another question: how do you feel when it rains?' );

		expect(
			getByText( 'Another question: how do you feel when it rains?' )
		).toBeVisible();
	} );

	it( 'should not trigger an early completion if a trigger condition is met; all questions must be answered first', async () => {
		provideCurrentSurvey( registry, multiQuestionSurvey );

		const { getByLabelText, getByText, findByText } = render(
			<CurrentSurvey />,
			{ registry }
		);

		// Even though the fixtures have a `trigger_completion` for this answer to
		// this question, it should not be shown until all questions are answered.
		fireEvent.click( getByLabelText( 'Delighted' ) );

		expect( () => {
			getByText( 'You answered positively!' );
		} ).toThrow( /Unable to find an element with the text/ );

		// The second question should appear after the first is answered.
		await findByText( 'Another question: how do you feel when it rains?' );

		expect(
			getByText( 'Another question: how do you feel when it rains?' )
		).toBeVisible();
	} );

	it( 'should show the completion for the first matching trigger', async () => {
		provideCurrentSurvey( registry, multiQuestionSurvey );

		const { getByLabelText, getByText, findByText } = render(
			<CurrentSurvey />,
			{ registry }
		);

		// Answering with this value causes the completion trigger to be met.
		fireEvent.click( getByLabelText( 'Delighted' ) );

		await findByText( 'Another question: how do you feel when it rains?' );
		fireEvent.click( getByLabelText( 'Neutral' ) );
		await findByText(
			'Another question: how do you feel when it is sunny?'
		);
		fireEvent.click( getByLabelText( 'Neutral' ) );
		await findByText(
			'Another question: how do you feel when it is overcast?'
		);
		fireEvent.click( getByLabelText( 'Neutral' ) );

		await findByText( 'You answered positively!' );

		expect( getByText( 'You answered positively!' ) ).toBeVisible();
	} );

	it( 'should mark the question as answered in the core/forms datastore', async () => {
		provideCurrentSurvey( registry );

		const { getByLabelText } = render( <CurrentSurvey />, { registry } );

		fireEvent.click( getByLabelText( 'Delighted' ) );

		await waitFor( () =>
			expect(
				registry
					.select( CORE_FORMS )
					.getValue(
						`survey-${ singleQuestionSurvey.session.session_id }`,
						'answers'
					)
			).toEqual( [
				{
					question_ordinal: 1,
					answer: {
						answer: { answer_ordinal: 5 },
					},
				},
			] )
		);
	} );

	it( 'should render nothing if no survey exists', () => {
		registry.dispatch( CORE_USER ).receiveGetSurvey( { survey: null } );

		const { container } = render( <CurrentSurvey />, { registry } );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( "should send a 'survey_closed' event when dismissed", () => {
		provideCurrentSurvey( registry );

		const { getByLabelText } = render( <CurrentSurvey />, { registry } );

		fireEvent.click( getByLabelText( 'Dismiss' ) );

		expect( fetchMock ).toHaveFetched(
			'/google-site-kit/v1/core/user/data/survey-event?_locale=user',
			{
				body: {
					data: {
						event: {
							survey_closed: {},
						},
						session: singleQuestionSurvey.session,
					},
				},
				credentials: 'include',
				headers: {
					Accept: 'application/json, */*;q=0.1',
					'Content-Type': 'application/json',
				},
				method: 'POST',
			}
		);
	} );

	it( 'should render nothing if the survey is dismissed', () => {
		jest.useFakeTimers();

		provideCurrentSurvey( registry );

		const { container, getByLabelText } = render( <CurrentSurvey />, {
			registry,
		} );

		fireEvent.click( getByLabelText( 'Dismiss' ) );

		setTimeout( () => {
			expect( container ).toBeEmptyDOMElement();
		}, 1000 );

		jest.runAllTimers();
	} );

	it( 'should render the completed survey component if all questions have been answered', () => {
		provideCurrentSurvey( registry );

		registry
			.dispatch( CORE_FORMS )
			.setValues( `survey-${ singleQuestionSurvey.session.session_id }`, {
				// Mark this survey as answered so the "Survey Complete" component is
				// rendered.
				answers: [
					{
						question_ordinal: 1,
						answer: {
							answer: { answer_ordinal: 2 },
						},
					},
				],
			} );

		const { container } = render( <CurrentSurvey />, { registry } );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should trigger the first completion when no matching trigger_conditions are met', () => {
		provideCurrentSurvey( registry );

		registry
			.dispatch( CORE_FORMS )
			.setValues( `survey-${ singleQuestionSurvey.session.session_id }`, {
				// Mark this survey as answered so the "Survey Complete" component is
				// rendered.
				answers: [
					// 6 is not a valid answer ordinal for this survey and will cause no
					// trigger conditions to be met, so this should fallback to the first
					// trigger condition supplied.
					{
						question_ordinal: 1,
						answer: {
							answer: { answer_ordinal: 6 },
						},
					},
				],
			} );

		const { container } = render( <CurrentSurvey />, { registry } );

		expect( container ).toMatchSnapshot();
	} );

	it( "should send a 'completion_shown' event when the survey is completed and the completion component is shown for the first time", () => {
		provideCurrentSurvey( registry );

		registry
			.dispatch( CORE_FORMS )
			.setValues( `survey-${ singleQuestionSurvey.session.session_id }`, {
				// Mark this survey as answered so the "Survey Complete" component is
				// rendered.
				answers: [
					// 6 is not a valid answer ordinal for this survey and will cause no
					// trigger conditions to be met, so this should fallback to the first
					// trigger condition supplied.
					{
						question_ordinal: 1,
						answer: {
							answer: { answer_ordinal: 5 },
						},
					},
				],
			} );

		const { rerender } = render( <CurrentSurvey />, { registry } );

		expect( fetchMock ).toHaveFetched(
			'/google-site-kit/v1/core/user/data/survey-event?_locale=user',
			{
				body: {
					data: {
						event: {
							completion_shown: {
								completion_ordinal:
									singleQuestionSurvey.survey_payload
										.completion[ 0 ].completion_ordinal,
							},
						},
						session: singleQuestionSurvey.session,
					},
				},
				credentials: 'include',
				headers: {
					Accept: 'application/json, */*;q=0.1',
					'Content-Type': 'application/json',
				},
				method: 'POST',
			}
		);

		fetchMock.reset();

		// Render again to ensure we don't send another `completion_shown` event.
		rerender();

		expect( fetchMock ).not.toHaveFetched();
	} );

	it( "should send a 'follow_up_link_clicked' event, then a 'survey_closed' event when a follow-up link is clicked", () => {
		provideCurrentSurvey( registry );

		registry
			.dispatch( CORE_FORMS )
			.setValues( `survey-${ singleQuestionSurvey.session.session_id }`, {
				// Mark this survey as answered so the "Survey Complete" component is
				// rendered.
				answers: [
					{
						question_ordinal: 1,
						answer: {
							answer: { answer_ordinal: 5 },
						},
					},
				],
			} );

		const { getByText } = render( <CurrentSurvey />, { registry } );

		fireEvent.click( getByText( 'Let’s go' ) );

		expect( fetchMock ).toHaveFetched(
			'/google-site-kit/v1/core/user/data/survey-event?_locale=user',
			{
				body: {
					data: {
						event: {
							follow_up_link_clicked: {
								completion_ordinal: 1,
							},
						},
						session: singleQuestionSurvey.session,
					},
				},
				credentials: 'include',
				headers: {
					Accept: 'application/json, */*;q=0.1',
					'Content-Type': 'application/json',
				},
				method: 'POST',
			}
		);

		expect( fetchMock ).toHaveFetched(
			'/google-site-kit/v1/core/user/data/survey-event?_locale=user',
			{
				body: {
					data: {
						event: {
							survey_closed: {},
						},
						session: singleQuestionSurvey.session,
					},
				},
				credentials: 'include',
				headers: {
					Accept: 'application/json, */*;q=0.1',
					'Content-Type': 'application/json',
				},
				method: 'POST',
			}
		);
	} );

	describe( 'conditional questions', () => {
		let surveyComponent;

		const [ firstQuestion, secondQuestion, thirdQuestion ] =
			multiQuestionConditionalSurvey.survey_payload.question;

		const [ defaultCompletion, firstCompletion, secondCompletion ] =
			multiQuestionConditionalSurvey.survey_payload.completion;

		beforeEach( () => {
			provideCurrentSurvey( registry, multiQuestionConditionalSurvey );

			surveyComponent = render( <CurrentSurvey />, {
				registry,
			} );
		} );

		it( 'should render the appropriate question', () => {
			expect(
				surveyComponent.getByText( firstQuestion.question_text )
			).toBeInTheDocument();
		} );

		it( 'should advance to the completion if the 3rd answer is selected', async () => {
			fireEvent.click(
				surveyComponent.getByLabelText(
					firstQuestion.question.answer_choice[ 2 ].text
				)
			);

			await surveyComponent.findByText(
				defaultCompletion.completion_title
			);

			expect(
				surveyComponent.getByText( defaultCompletion.completion_title )
			).toBeInTheDocument();
		} );

		it( 'should advance to the first completion if 4th or 5th answer is selected for the first question', async () => {
			fireEvent.click(
				surveyComponent.getByLabelText(
					firstQuestion.question.answer_choice[ 4 ].text
				)
			);

			await surveyComponent.findByText( thirdQuestion.question_text );

			fireEvent.click(
				surveyComponent.getByLabelText(
					thirdQuestion.question.answer_choice[ 0 ].text
				)
			);

			await surveyComponent.findByText(
				firstCompletion.completion_title
			);

			expect(
				surveyComponent.getByText( firstCompletion.completion_title )
			).toBeInTheDocument();
		} );

		it( 'should advance to the second completion if 1st or 2nd answer is selected for the first question', async () => {
			fireEvent.click(
				surveyComponent.getByLabelText(
					firstQuestion.question.answer_choice[ 1 ].text
				)
			);

			await surveyComponent.findByText( secondQuestion.question_text );

			fireEvent.click(
				surveyComponent.getByLabelText(
					secondQuestion.question.answer_choice[ 0 ].text
				)
			);

			await surveyComponent.findByText(
				secondCompletion.completion_title
			);

			expect(
				surveyComponent.getByText( secondCompletion.completion_title )
			).toBeInTheDocument();
		} );
	} );
} );
