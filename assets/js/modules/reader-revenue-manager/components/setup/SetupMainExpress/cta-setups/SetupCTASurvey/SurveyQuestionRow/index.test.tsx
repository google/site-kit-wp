/**
 * SurveyQuestionRow tests.
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
import { fireEvent, render, screen } from '@tests/js/test-utils';
import SurveyQuestionRow, { SurveyQuestionRowProps } from '.';
const question = 'What is your highest education level?';
const answers = [
	{ id: 'secondary', label: 'Secondary education' },
	{ id: 'undergraduate', label: 'Undergraduate degree' },
	{ id: 'postgraduate', label: 'Postgraduate degree' },
];

function renderRow( props: Partial< SurveyQuestionRowProps > = {} ) {
	return render(
		<SurveyQuestionRow
			answers={ answers }
			isAdded={ false }
			isExpanded={ false }
			question={ question }
			{ ...props }
		/>
	);
}

describe( 'SurveyQuestionRow', () => {
	it( 'calls onAdd when the question is not added', () => {
		const onAdd = jest.fn();
		const onRemove = jest.fn();

		renderRow( { onAdd, onRemove } );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Add question' } )
		);

		expect( onAdd ).toHaveBeenCalledTimes( 1 );
		expect( onRemove ).not.toHaveBeenCalled();
	} );

	it( 'calls onRemove when the question is added', () => {
		const onAdd = jest.fn();
		const onRemove = jest.fn();

		renderRow( { isAdded: true, onAdd, onRemove } );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove question' } )
		);

		expect( onRemove ).toHaveBeenCalledTimes( 1 );
		expect( onAdd ).not.toHaveBeenCalled();
	} );

	it( 'populates the disabled description and tooltip when disabled with a message', async () => {
		const disabledMessage = 'You have reached the maximum of 3 questions.';

		renderRow( { disabled: true, disabledMessage } );

		const button = screen.getByRole( 'button', { name: 'Add question' } );

		expect( button ).toBeDisabled();

		expect( button ).toHaveAccessibleDescription(
			`${ disabledMessage } ${ question }`
		);

		expect( screen.getByText( disabledMessage ) ).toHaveAttribute(
			'hidden'
		);

		fireEvent.mouseOver( button );

		expect( await screen.findByRole( 'tooltip' ) ).toHaveTextContent(
			disabledMessage
		);
	} );

	it( 'only uses the disabledMessage as the description and tooltip if disabled', async () => {
		const disabledMessage = 'something';

		renderRow( { disabled: false, disabledMessage } );

		const button = screen.getByRole( 'button', { name: 'Add question' } );

		expect( button ).toBeEnabled();

		expect( button ).not.toHaveAccessibleDescription(
			new RegExp( disabledMessage )
		);

		expect( screen.queryByText( disabledMessage ) ).not.toBeInTheDocument();

		fireEvent.mouseOver( button );

		await expect( screen.findByRole( 'tooltip' ) ).rejects.toThrow();
	} );

	it( 'renders a plain row without an expand button or content when onExpand is absent', () => {
		const { container } = renderRow();
		const row = container.firstElementChild;

		expect( row ).toHaveClass( 'googlesitekit-rrm-survey-question-row' );

		expect( row ).not.toHaveClass(
			'googlesitekit-rrm-survey-question-row--is-expandable'
		);

		expect( row ).not.toHaveClass(
			'googlesitekit-rrm-survey-question-row--is-expanded'
		);

		expect( row ).not.toHaveClass(
			'googlesitekit-rrm-survey-question-row--is-highlighted'
		);

		expect( screen.getByText( question ) ).toBeVisible();

		expect(
			screen.queryByRole( 'button', { name: question } )
		).not.toBeInTheDocument();

		expect(
			screen.queryByText( answers[ 0 ].label )
		).not.toBeInTheDocument();
	} );

	it( 'highlights a row with isExpanded but no onExpand without showing any expandable content', () => {
		const { container } = renderRow( { isExpanded: true } );

		const row = container.firstElementChild;

		expect( row ).toHaveClass(
			'googlesitekit-rrm-survey-question-row--is-highlighted'
		);

		expect( row ).not.toHaveClass(
			'googlesitekit-rrm-survey-question-row--is-expandable'
		);

		expect( row ).not.toHaveClass(
			'googlesitekit-rrm-survey-question-row--is-expanded'
		);

		expect(
			screen.queryByRole( 'button', { name: question } )
		).not.toBeInTheDocument();

		expect(
			screen.queryByText( answers[ 0 ].label )
		).not.toBeInTheDocument();
	} );

	it( 'renders a collapsed expandable row and requests expansion when clicked', () => {
		const onExpand = jest.fn();

		const { container } = renderRow( { onExpand } );

		const row = container.firstElementChild;
		const button = screen.getByRole( 'button', { name: question } );

		expect( row ).toHaveClass(
			'googlesitekit-rrm-survey-question-row--is-expandable'
		);

		expect( row ).not.toHaveClass(
			'googlesitekit-rrm-survey-question-row--is-expanded'
		);

		expect( row ).not.toHaveClass(
			'googlesitekit-rrm-survey-question-row--is-highlighted'
		);

		expect( button ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( screen.getByText( answers[ 0 ].label ) ).not.toBeVisible();

		fireEvent.click( button );

		expect( onExpand ).toHaveBeenCalledWith( true );
	} );

	it( 'renders an expanded expandable row and requests collapse when clicked', () => {
		const onExpand = jest.fn();

		const { container } = renderRow( { isExpanded: true, onExpand } );

		const row = container.firstElementChild;
		const button = screen.getByRole( 'button', { name: question } );

		expect( row ).toHaveClass(
			'googlesitekit-rrm-survey-question-row--is-expandable',
			'googlesitekit-rrm-survey-question-row--is-expanded'
		);

		expect( row ).not.toHaveClass(
			'googlesitekit-rrm-survey-question-row--is-highlighted'
		);

		expect( button ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( screen.getByText( answers[ 0 ].label ) ).toBeVisible();

		fireEvent.click( button );

		expect( onExpand ).toHaveBeenCalledWith( false );
	} );

	it( 'renders the leading element before the action button', () => {
		renderRow( {
			isAdded: true,
			leadingElement: <button>Move question</button>,
		} );

		const leadingElement = screen.getByRole( 'button', {
			name: 'Move question',
		} );

		const actionButton = screen.getByRole( 'button', {
			name: 'Remove question',
		} );

		expect( leadingElement ).toBeVisible();

		expect( screen.getAllByRole( 'button' ) ).toEqual( [
			leadingElement,
			actionButton,
		] );
	} );
} );
