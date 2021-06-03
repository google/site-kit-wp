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
import Survey from './Survey';
import { render, fireEvent, createTestRegistry } from '../../../../tests/js/test-utils';
import * as fixtures from './__fixtures__';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';

describe( 'Survey', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should render a survey when one exists in the datastore', async () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.postOnce( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { container } = render( <Survey />, { registry } );

		expect( fetchMock ).toHaveFetched( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/ );

		expect( container ).toMatchSnapshot();
	} );

	it( "should send a 'survey_shown' event on mount", async () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.postOnce( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		render( <Survey />, { registry } );

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
	} );

	it( "should send a 'question_answered' event when a question is answered", async () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { getByLabelText } = render( <Survey />, { registry } );

		fireEvent.click( getByLabelText( 'Delighted icon' ) );

		expect( fetchMock ).toHaveFetched(
			'/google-site-kit/v1/core/user/data/survey-event?_locale=user',
			{
				body: {
					data: {
						event: {
							question_answered: {
								question_ordinal: 1,
								answer: {
									answer_ordinal: 5,
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
	} );

	it( 'should mark the question as answered in the core/forms datastore', async () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { getByLabelText } = render( <Survey />, { registry } );

		fireEvent.click( getByLabelText( 'Delighted icon' ) );

		expect(
			registry
				.select( CORE_FORMS )
				.getValue(
					`survey-${ fixtures.singleQuestionSurvey.session.session_id }`,
					'answers'
				)
		).toEqual(
			[ { question_ordinal: 1, answer_ordinal: 5 } ]
		);
	} );

	it( 'should render nothing if no survey exists', () => {
		const { container } = render( <Survey />, { registry } );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing if the survey is dismissed', () => {
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'jestSurvey' } );

		fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		const { container, getByLabelText } = render( <Survey />, { registry } );

		fireEvent.click( getByLabelText( 'Dismiss this survey' ) );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
