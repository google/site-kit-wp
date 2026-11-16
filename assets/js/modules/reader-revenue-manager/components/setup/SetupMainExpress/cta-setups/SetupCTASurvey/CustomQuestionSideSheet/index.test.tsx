/**
 * CustomQuestionSideSheet tests.
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
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { act, fireEvent, render, screen } from '@tests/js/test-utils';
import { CustomSurveyQuestion } from './types';
import CustomQuestionSideSheet, { CustomQuestionSideSheetProps } from '.';

const existingQuestion: CustomSurveyQuestion = {
	question: 'Which topics interest you?',
	answers: [ 'Politics', 'Sport', 'Culture' ],
	category: 'Interests',
};

function renderSideSheet(
	props: Partial< CustomQuestionSideSheetProps > = {}
) {
	return render(
		<CustomQuestionSideSheet
			{ ...{ isOpen: true, onClose: jest.fn(), onSave: jest.fn() } }
			{ ...props }
		/>
	);
}

function getAnswerFields() {
	return screen.getAllByRole( 'textbox', { name: /^Answer \d$/ } );
}

function getAnswerField( name: string ) {
	return screen.getByRole( 'textbox', { name } );
}

function getField( label: string ) {
	return screen.getByLabelText( label );
}

// eslint-disable-next-line sitekit/acronym-case
function type( element: HTMLElement, value: string ) {
	fireEvent.change( element, { target: { value } } );
}

function getSaveButton() {
	return screen.getByRole( 'button', { name: 'Save' } );
}

function fillQuestion( answers: string[] ) {
	type( getField( 'Add your question' ), 'Which topics interest you?' );

	answers.forEach( ( answer, index ) =>
		type( getAnswerFields()[ index ], answer )
	);
}

describe( 'CustomQuestionSideSheet', () => {
	afterEach( () => {
		document.body.classList.remove(
			'googlesitekit-side-sheet-scroll-lock'
		);
	} );

	it( 'should render the title, fields and their limits', () => {
		renderSideSheet();

		expect(
			screen.getByRole( 'heading', { name: 'Create a custom question' } )
		).toBeInTheDocument();

		expect( getField( 'Add your question' ) ).toHaveAttribute(
			'maxlength',
			'140'
		);

		expect( getField( 'Add a category (optional)' ) ).toHaveAttribute(
			'maxlength',
			'100'
		);

		expect(
			screen.getByText( 'This will show up in your Analytics' )
		).toBeInTheDocument();

		const answersGroup = screen.getByRole( 'group', {
			name: 'Add 2-5 answers, you can reorder them if needed',
		} );

		const answerFields = getAnswerFields();

		answerFields.forEach( ( field ) =>
			expect( answersGroup ).toContainElement( field )
		);

		expect( answerFields ).toHaveLength( 2 );

		answerFields.forEach( ( field ) =>
			expect( field ).toHaveAttribute( 'maxlength', '100' )
		);

		expect( getAnswerField( 'Answer 1' ) ).toHaveValue( '' );
		expect( getAnswerField( 'Answer 2' ) ).toHaveValue( '' );

		[ 'Move answer 1', 'Move answer 2' ].forEach( ( name ) =>
			expect( screen.getByRole( 'button', { name } ) ).toBeInTheDocument()
		);

		[ 'Remove answer 1', 'Remove answer 2' ].forEach( ( name ) =>
			expect( screen.getByRole( 'button', { name } ) ).toBeInTheDocument()
		);
	} );

	it( 'should add answers up to the maximum and focus the new field', () => {
		renderSideSheet();

		const addButton = screen.getByRole( 'button', { name: 'Add answer' } );

		for ( let count = 3; count <= 5; count++ ) {
			fireEvent.click( addButton );

			expect( getAnswerFields() ).toHaveLength( count );
			expect( getAnswerField( `Answer ${ count }` ) ).toHaveFocus();
		}

		expect( addButton ).toBeDisabled();
	} );

	it( 'should remove answers and renumber the remaining fields', () => {
		renderSideSheet( { question: existingQuestion } );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove answer 1' } )
		);

		expect( getAnswerFields() ).toHaveLength( 2 );
		expect( getAnswerField( 'Answer 1' ) ).toHaveValue( 'Sport' );
		expect( getAnswerField( 'Answer 2' ) ).toHaveValue( 'Culture' );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove answer 2' } )
		);
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove answer 1' } )
		);

		expect(
			screen.queryAllByRole( 'textbox', { name: /^Answer \d$/ } )
		).toHaveLength( 0 );
	} );

	it( 'should reorder answers with the keyboard and renumber them', () => {
		renderSideSheet( { question: existingQuestion } );

		fireEvent.keyDown(
			screen.getByRole( 'button', { name: 'Move answer 1' } ),
			{ key: 'ArrowDown' }
		);

		expect( getAnswerField( 'Answer 1' ) ).toHaveValue( 'Sport' );
		expect( getAnswerField( 'Answer 2' ) ).toHaveValue( 'Politics' );
		expect( getAnswerField( 'Answer 3' ) ).toHaveValue( 'Culture' );

		fireEvent.keyDown(
			screen.getByRole( 'button', { name: 'Move answer 3' } ),
			{ key: 'ArrowUp' }
		);

		expect( getAnswerField( 'Answer 2' ) ).toHaveValue( 'Culture' );
		expect( getAnswerField( 'Answer 3' ) ).toHaveValue( 'Politics' );
	} );

	it( 'should count only the answers that have text', () => {
		const { container } = renderSideSheet();

		function count() {
			return container.ownerDocument.querySelector(
				'.googlesitekit-rrm-custom-question-form__count'
			);
		}

		expect( count() ).toHaveTextContent( '0 answers added (up to 5)' );

		type( getAnswerField( 'Answer 1' ), 'Politics' );

		expect( count() ).toHaveTextContent( '1 answer added (up to 5)' );

		type( getAnswerField( 'Answer 2' ), '   ' );

		expect( count() ).toHaveTextContent( '1 answer added (up to 5)' );

		type( getAnswerField( 'Answer 2' ), 'Sport' );

		expect( count() ).toHaveTextContent( '2 answers added (up to 5)' );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove answer 1' } )
		);

		expect( count() ).toHaveTextContent( '1 answer added (up to 5)' );
	} );

	it( 'should show the error notice while there are fewer than two answer fields', () => {
		renderSideSheet();

		expect(
			screen.queryByText( 'You need a minimum of 2 answers' )
		).not.toBeInTheDocument();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove answer 2' } )
		);

		expect(
			screen.getByText( 'You need a minimum of 2 answers' )
		).toBeInTheDocument();

		fireEvent.click( screen.getByRole( 'button', { name: 'Add answer' } ) );

		expect(
			screen.queryByText( 'You need a minimum of 2 answers' )
		).not.toBeInTheDocument();
	} );

	it( 'should disable Save until the question and every answer have text', () => {
		renderSideSheet();

		expect( getSaveButton() ).toBeDisabled();

		type( getAnswerField( 'Answer 1' ), 'Politics' );
		type( getAnswerField( 'Answer 2' ), 'Sport' );

		expect( getSaveButton() ).toBeDisabled();

		type( getField( 'Add your question' ), '   ' );

		expect( getSaveButton() ).toBeDisabled();

		type( getField( 'Add your question' ), 'Which topics interest you?' );

		expect( getSaveButton() ).toBeEnabled();

		type( getAnswerField( 'Answer 2' ), '  ' );

		expect( getSaveButton() ).toBeDisabled();

		type( getAnswerField( 'Answer 2' ), 'Sport' );

		fireEvent.click( screen.getByRole( 'button', { name: 'Add answer' } ) );

		expect( getSaveButton() ).toBeDisabled();

		type( getAnswerField( 'Answer 3' ), 'Culture' );

		expect( getSaveButton() ).toBeEnabled();
	} );

	it( 'should disable Save while there are fewer than two answer fields', () => {
		renderSideSheet();

		type( getField( 'Add your question' ), 'Which topics interest you?' );
		type( getAnswerField( 'Answer 1' ), 'Politics' );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove answer 2' } )
		);

		expect( getSaveButton() ).toBeDisabled();
	} );

	it( 'should disable Save without the error notice while an answer field is empty', () => {
		renderSideSheet();

		type( getField( 'Add your question' ), 'Which topics interest you?' );
		type( getAnswerField( 'Answer 1' ), 'Politics' );
		type( getAnswerField( 'Answer 2' ), 'Sport' );

		fireEvent.click( screen.getByRole( 'button', { name: 'Add answer' } ) );

		type( getAnswerField( 'Answer 3' ), '   ' );

		expect( getSaveButton() ).toBeDisabled();

		expect(
			screen.queryByText( 'You need a minimum of 2 answers' )
		).not.toBeInTheDocument();
	} );

	it( 'should report the trimmed question in order, then close', () => {
		const onSave = jest.fn();
		const onClose = jest.fn();

		renderSideSheet( { onSave, onClose } );
		fillQuestion( [ ' Politics ', 'Sport' ] );

		type( getField( 'Add a category (optional)' ), ' Interests ' );

		fireEvent.keyDown(
			screen.getByRole( 'button', { name: 'Move answer 2' } ),
			{ key: 'ArrowUp' }
		);

		fireEvent.click( getSaveButton() );

		expect( onSave ).toHaveBeenCalledWith( {
			question: 'Which topics interest you?',
			answers: [ 'Sport', 'Politics' ],
			category: 'Interests',
		} );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it.each( [
		[
			'Cancel',
			() =>
				fireEvent.click(
					screen.getByRole( 'button', { name: 'Cancel' } )
				),
		],
		[
			'the close icon',
			() =>
				fireEvent.click(
					screen.getByRole( 'button', { name: 'Close' } )
				),
		],
		[
			'the Escape key',
			() =>
				fireEvent.keyDown( document, {
					key: 'Escape',
					keyCode: ESCAPE,
				} ),
		],
		[ 'a click outside', () => fireEvent.mouseDown( document.body ) ],
	] )( 'should close without reporting when using %s', ( _, close ) => {
		const onSave = jest.fn();
		const onClose = jest.fn();

		renderSideSheet( { onSave, onClose } );

		fillQuestion( [ 'Politics', 'Sport' ] );

		close();

		expect( onClose ).toHaveBeenCalled();
		expect( onSave ).not.toHaveBeenCalled();
	} );

	it( 'should fill in an existing question and report the edited question', () => {
		const onSave = jest.fn();

		renderSideSheet( { question: existingQuestion, onSave } );

		expect( getField( 'Add your question' ) ).toHaveValue(
			'Which topics interest you?'
		);

		expect(
			getAnswerFields().map(
				( field ) => ( field as HTMLInputElement ).value
			)
		).toEqual( [ 'Politics', 'Sport', 'Culture' ] );

		expect( getField( 'Add a category (optional)' ) ).toHaveValue(
			'Interests'
		);

		type( getAnswerField( 'Answer 3' ), 'Arts' );

		fireEvent.click( getSaveButton() );

		expect( onSave ).toHaveBeenCalledWith( {
			...existingQuestion,
			answers: [ 'Politics', 'Sport', 'Arts' ],
		} );
	} );

	it( 'should render nothing in the sheet while it is closed', () => {
		renderSideSheet( { isOpen: false } );

		expect(
			screen.queryByLabelText( 'Add your question' )
		).not.toBeInTheDocument();
	} );

	it( 'should start from the given question each time it opens', () => {
		function Wrapper() {
			const [ isOpen, setIsOpen ] = useState( true );

			return (
				<div>
					<button onClick={ () => setIsOpen( true ) }>Open</button>
					<CustomQuestionSideSheet
						isOpen={ isOpen }
						onClose={ () => setIsOpen( false ) }
						onSave={ jest.fn() }
						question={ existingQuestion }
					/>
				</div>
			);
		}

		render( <Wrapper /> );

		type( getField( 'Add your question' ), 'Edited question' );
		fireEvent.click( screen.getByRole( 'button', { name: 'Add answer' } ) );
		fireEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		fireEvent.click( screen.getByRole( 'button', { name: 'Open' } ) );

		expect( getField( 'Add your question' ) ).toHaveValue(
			existingQuestion.question
		);
		expect(
			getAnswerFields().map(
				( field ) => ( field as HTMLInputElement ).value
			)
		).toEqual( existingQuestion.answers );
	} );

	it( 'should start from two empty answers when the existing question has none', () => {
		renderSideSheet( {
			question: { ...existingQuestion, answers: [] },
		} );

		expect( getField( 'Add your question' ) ).toHaveValue(
			'Which topics interest you?'
		);

		expect( getAnswerFields() ).toHaveLength( 2 );

		getAnswerFields().forEach( ( field ) =>
			expect( field ).toHaveValue( '' )
		);
	} );

	it( 'should focus the question field when it opens', async () => {
		jest.useFakeTimers();

		renderSideSheet();

		await act( async () => {
			await jest.runAllTimersAsync();
		} );

		expect( getField( 'Add your question' ) ).toHaveFocus();

		jest.useRealTimers();
	} );

	it( 'should return focus to the opening control when it closes', async () => {
		jest.useFakeTimers();

		function Wrapper() {
			const [ isOpen, setIsOpen ] = useState( false );

			return (
				<div>
					<button onClick={ () => setIsOpen( true ) }>Open</button>
					<CustomQuestionSideSheet
						isOpen={ isOpen }
						onClose={ () => setIsOpen( false ) }
						onSave={ jest.fn() }
					/>
				</div>
			);
		}

		render( <Wrapper /> );

		const openButton = screen.getByRole( 'button', { name: 'Open' } );

		openButton.focus();
		fireEvent.click( openButton );

		await act( async () => {
			await jest.runAllTimersAsync();
		} );

		expect( getField( 'Add your question' ) ).toHaveFocus();

		fireEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		await act( async () => {
			await jest.runAllTimersAsync();
		} );

		expect( openButton ).toHaveFocus();

		jest.useRealTimers();
	} );
} );
