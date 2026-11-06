/**
 * Reader Revenue Manager Survey CTA Preview component tests.
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
import { render, screen } from '@tests/js/test-utils';
import Preview from './index';

const defaultProps = {
	publicationName: 'Example Publication',
	surveyText: 'Tell us about yourself.',
	question: 'How often do you visit our site?',
	questionAnswers: [ 'Daily', 'Weekly', 'Monthly' ],
	questionCount: 3,
};

describe( 'Survey Preview', () => {
	it( 'should render the survey text and question from props', () => {
		render( <Preview { ...defaultProps } /> );

		expect(
			screen.getByText( defaultProps.surveyText )
		).toBeInTheDocument();

		expect( screen.getByText( defaultProps.question ) ).toBeInTheDocument();
	} );

	it( 'should render the publication name in the header and disclaimer', () => {
		render( <Preview { ...defaultProps } /> );

		expect(
			screen.getByText( defaultProps.publicationName, { exact: true } )
		).toBeInTheDocument();

		expect(
			screen.getByText( /Your responses to this survey are anonymous/ )
		).toHaveTextContent(
			'Please see the Example Publication’s Privacy Policy to learn more about how they use this information.'
		);

		expect(
			screen.queryByText( 'Publication name' )
		).not.toBeInTheDocument();
	} );

	it( 'should use the placeholder publication name when none is supplied', () => {
		render( <Preview { ...defaultProps } publicationName={ undefined } /> );

		expect(
			screen.getByText( 'Publication name', { exact: true } )
		).toBeInTheDocument();

		expect(
			screen.getByText( /Your responses to this survey are anonymous/ )
		).toHaveTextContent(
			'Please see the Publication name’s Privacy Policy'
		);
	} );

	it.each( [ undefined, '' ] )(
		'should omit the survey text when it is %s',
		( surveyText ) => {
			render( <Preview { ...defaultProps } surveyText={ surveyText } /> );

			expect(
				screen.queryByText( defaultProps.surveyText )
			).not.toBeInTheDocument();

			expect(
				screen.getByText( defaultProps.question )
			).toBeInTheDocument();
		}
	);

	it( 'should omit the question, answers, count, and Next button when the question is empty', () => {
		render( <Preview { ...defaultProps } question="" /> );

		expect(
			screen.queryByText( defaultProps.question )
		).not.toBeInTheDocument();

		expect(
			screen.queryByText( 'question 1 of 3' )
		).not.toBeInTheDocument();

		expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Next' } )
		).not.toBeInTheDocument();

		expect(
			screen.getByText( defaultProps.surveyText )
		).toBeInTheDocument();

		expect( screen.getByText( 'Privacy Policy' ) ).toBeInTheDocument();
	} );

	it.each( [ 2, 3 ] )(
		'should show question 1 of %s for multiple questions',
		( questionCount ) => {
			render(
				<Preview { ...defaultProps } questionCount={ questionCount } />
			);

			expect(
				screen.getByText( `question 1 of ${ questionCount }` )
			).toBeInTheDocument();
		}
	);

	it( 'should omit the question count for a single question', () => {
		render( <Preview { ...defaultProps } questionCount={ 1 } /> );

		expect( screen.queryByText( /question 1 of/ ) ).not.toBeInTheDocument();
		expect( screen.getByText( defaultProps.question ) ).toBeInTheDocument();
	} );

	it( 'should render answers in order as disabled, unselected radios', () => {
		render( <Preview { ...defaultProps } /> );

		const radios = screen.getAllByRole( 'radio' );

		expect( radios ).toHaveLength( defaultProps.questionAnswers.length );

		radios.forEach( ( radio, index ) => {
			expect( radio ).toHaveAccessibleName(
				defaultProps.questionAnswers[ index ]
			);
			expect( radio ).toBeDisabled();
			expect( radio ).not.toBeChecked();
		} );
	} );

	it( 'should disable the Next button', () => {
		render( <Preview { ...defaultProps } /> );

		expect( screen.getByRole( 'button', { name: 'Next' } ) ).toBeDisabled();
	} );

	it( 'should render the disclaimer with a non-interactive Privacy Policy span', () => {
		render( <Preview { ...defaultProps } /> );

		const link = screen.getByText( 'Privacy Policy' );

		expect( link.tagName ).toBe( 'SPAN' );

		expect( link ).toHaveClass(
			'googlesitekit-rrm-cta-preview-pane__link'
		);

		expect( link ).not.toHaveAttribute( 'href' );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();

		expect(
			screen.getByText( /Your responses to this survey are anonymous/ )
		).toHaveTextContent(
			'Google collects aggregated anonymous data for performance measurement purposes.'
		);
	} );
} );
