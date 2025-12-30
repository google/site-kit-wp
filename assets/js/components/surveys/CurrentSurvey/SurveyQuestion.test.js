/**
 * SurveyQuestion component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { render } from '../../../../../tests/js/test-utils';
import SurveyQuestion from './SurveyQuestion';
import {
	singleQuestionMultiSelect,
	singleQuestionOpenText,
	singleQuestionSurveySingleSelect,
	multiQuestionSurvey,
} from '@/js/components/surveys/__fixtures__';

describe( 'SurveyQuestion', () => {
	const defaultProps = {
		answerQuestion: jest.fn(),
		dismissSurvey: jest.fn(),
		isLastQuestion: true,
	};

	it( 'should render a multi select question correctly', () => {
		const currentQuestion =
			singleQuestionMultiSelect.survey_payload.question[ 0 ];

		const { container, getByText } = render(
			<SurveyQuestion
				{ ...defaultProps }
				currentQuestion={ currentQuestion }
			/>
		);

		expect( container ).toMatchSnapshot();

		expect(
			getByText( currentQuestion.question_text )
		).toBeInTheDocument();

		expect(
			container.querySelector( '.googlesitekit-survey__multi-select' )
		).toBeInTheDocument();

		expect( getByText( 'Submit' ) ).toBeInTheDocument();
	} );

	it( 'should render an open text question correctly', () => {
		const currentQuestion =
			singleQuestionOpenText.survey_payload.question[ 0 ];

		const { container, getByText } = render(
			<SurveyQuestion
				{ ...defaultProps }
				currentQuestion={ currentQuestion }
			/>
		);

		expect( container ).toMatchSnapshot();

		expect(
			getByText( currentQuestion.question_text )
		).toBeInTheDocument();

		expect(
			container.querySelector( '.googlesitekit-survey__open-text' )
		).toBeInTheDocument();

		expect( getByText( 'Submit' ) ).toBeInTheDocument();
	} );

	it( 'should render a rating question correctly', () => {
		const currentQuestion =
			multiQuestionSurvey.survey_payload.question[ 0 ];

		const { container, getByText } = render(
			<SurveyQuestion
				{ ...defaultProps }
				currentQuestion={ currentQuestion }
			/>
		);

		expect( container ).toMatchSnapshot();

		expect(
			container.querySelector( '.googlesitekit-survey__question-rating' )
		).toBeInTheDocument();

		expect(
			getByText( currentQuestion.question_text )
		).toBeInTheDocument();
	} );

	it( 'should render a single select question correctly', () => {
		const currentQuestion =
			singleQuestionSurveySingleSelect.survey_payload.question[ 0 ];

		const { container, getByText } = render(
			<SurveyQuestion
				{ ...defaultProps }
				currentQuestion={ currentQuestion }
			/>
		);

		expect( container ).toMatchSnapshot();

		expect(
			getByText( currentQuestion.question_text )
		).toBeInTheDocument();

		expect(
			container.querySelector( '.googlesitekit-single-select__choice' )
		).toBeInTheDocument();

		expect( getByText( 'Submit' ) ).toBeInTheDocument();
	} );

	it( 'should display "Next" button text when not the last question', () => {
		const currentQuestion =
			singleQuestionSurveySingleSelect.survey_payload.question[ 0 ];

		const { getByText } = render(
			<SurveyQuestion
				{ ...defaultProps }
				currentQuestion={ currentQuestion }
				isLastQuestion={ false }
			/>
		);

		expect( getByText( 'Next' ) ).toBeInTheDocument();
	} );

	it( 'should not render anything for invalid question types', () => {
		const currentQuestion = {
			question_text: 'Invalid question type',
			question_type: 'invalid_type',
			question: {},
		};

		const { container } = render(
			<SurveyQuestion
				{ ...defaultProps }
				currentQuestion={ currentQuestion }
			/>
		);

		expect( container.firstChild ).toBeNull();
	} );
} );
