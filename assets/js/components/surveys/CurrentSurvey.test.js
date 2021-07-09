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
import CurrentSurvey from './CurrentSurvey';
import { render, fireEvent, createTestRegistry, waitFor } from '../../../../tests/js/test-utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import * as fixtures from './__fixtures__';

describe( 'CurrentSurvey', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetTracking( { enabled: true } );
	} );

	it( 'should render a survey when one exists in the datastore', async () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.postOnce( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { container } = render( <CurrentSurvey />, { registry } );

		expect( fetchMock ).toHaveFetched( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/ );

		expect( container ).toMatchSnapshot();
	} );

	it( "should render a rating question when the `question_type` is 'rating'", async () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.postOnce( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { container } = render( <CurrentSurvey />, { registry } );

		expect( fetchMock ).toHaveFetched( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/ );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render nothing when the `question_type` is unknown', async () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.invalidQuestionTypeSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.postOnce( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { container } = render( <CurrentSurvey />, { registry } );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( "should send a 'survey_shown' event on mount", async () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.postOnce( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { rerender } = render( <CurrentSurvey />, { registry } );

		expect( fetchMock ).toHaveFetched(
			'/google-site-kit/v1/core/user/data/survey-event?_locale=user',
			{
				body: {
					data: {
						event: { survey_shown: {} },
						session: fixtures.singleQuestionSurvey.session,
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
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { getByLabelText, findByText } = render( <CurrentSurvey />, { registry } );

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
						session: fixtures.singleQuestionSurvey.session,
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
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.multiQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { getByLabelText, getByText, findByText } = render( <CurrentSurvey />, { registry } );

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
						session: fixtures.multiQuestionSurvey.session,
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

		expect( getByText( 'Another question: how do you feel when it rains?' ) ).toBeVisible();
	} );

	it( 'should not trigger an early completion if a trigger condition is met; all questions must be answered first', async () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.multiQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { getByLabelText, getByText, findByText } = render( <CurrentSurvey />, { registry } );

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
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.multiQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { getByLabelText, getByText, findByText } = render( <CurrentSurvey />, { registry } );

		// Answering with this value causes the completion trigger to be met.
		fireEvent.click( getByLabelText( 'Delighted' ) );

		await findByText( 'Another question: how do you feel when it rains?' );
		fireEvent.click( getByLabelText( 'Neutral' ) );
		await findByText( 'Another question: how do you feel when it is sunny?' );
		fireEvent.click( getByLabelText( 'Neutral' ) );
		await findByText( 'Another question: how do you feel when it is overcast?' );
		fireEvent.click( getByLabelText( 'Neutral' ) );

		await findByText( 'You answered positively!' );

		expect( getByText( 'You answered positively!' ) ).toBeVisible();
	} );

	it( 'should mark the question as answered in the core/forms datastore', async () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { getByLabelText } = render( <CurrentSurvey />, { registry } );

		fireEvent.click( getByLabelText( 'Delighted' ) );

		await waitFor( () => expect(
			registry
				.select( CORE_FORMS )
				.getValue(
					`survey-${ fixtures.singleQuestionSurvey.session.session_id }`,
					'answers'
				)
		).toEqual(
			[
				{
					question_ordinal: 1,
					answer: {
						answer: { answer_ordinal: 5 },
					},
				},
			]
		) );
	} );

	it( 'should render nothing if no survey exists', () => {
		const { container } = render( <CurrentSurvey />, { registry } );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( "should send a 'survey_closed' event when dismissed", () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

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
						session: fixtures.singleQuestionSurvey.session,
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

		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { container, getByLabelText } = render( <CurrentSurvey />, { registry } );

		fireEvent.click( getByLabelText( 'Dismiss' ) );

		setTimeout( () => {
			expect( container ).toBeEmptyDOMElement();
		}, 1000 );

		jest.runAllTimers();
	} );

	it( 'should render the completed survey component if all questions have been answered', () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		registry.dispatch( CORE_FORMS ).setValues(
			`survey-${ fixtures.singleQuestionSurvey.session.session_id }`,
			{
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
			}
		);

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { container } = render( <CurrentSurvey />, { registry } );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should trigger the first completion when no matching trigger_conditions are met', () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		registry.dispatch( CORE_FORMS ).setValues(
			`survey-${ fixtures.singleQuestionSurvey.session.session_id }`,
			{
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
			}
		);

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { container } = render( <CurrentSurvey />, { registry } );

		expect( container ).toMatchSnapshot();
	} );

	it( "should send a 'completion_shown' event when the survey is completed and the completion component is shown for the first time", () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		registry.dispatch( CORE_FORMS ).setValues(
			`survey-${ fixtures.singleQuestionSurvey.session.session_id }`,
			{
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
			}
		);

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { rerender } = render( <CurrentSurvey />, { registry } );

		expect( fetchMock ).toHaveFetched(
			'/google-site-kit/v1/core/user/data/survey-event?_locale=user',
			{
				body: {
					data: {
						event: {
							completion_shown: {
								completion_ordinal: fixtures.singleQuestionSurvey.survey_payload.completion[ 0 ].completion_ordinal,
							},
						},
						session: fixtures.singleQuestionSurvey.session,
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
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		registry.dispatch( CORE_FORMS ).setValues(
			`survey-${ fixtures.singleQuestionSurvey.session.session_id }`,
			{
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
			}
		);

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

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
						session: fixtures.singleQuestionSurvey.session,
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
						session: fixtures.singleQuestionSurvey.session,
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
} );
