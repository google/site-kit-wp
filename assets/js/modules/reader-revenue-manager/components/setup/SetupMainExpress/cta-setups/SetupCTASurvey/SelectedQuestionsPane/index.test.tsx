/**
 * SelectedQuestionsPane tests.
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

/**
 * Internal dependencies
 */
import { mockUseInstanceID } from '@tests/js/mock-use-instance-id';
import { fireEvent, render, screen, within } from '@tests/js/test-utils';
import { SelectedSurveyQuestion } from './types';
import SelectedQuestionsPane, { SelectedQuestionsPaneProps } from '.';

const questions: SelectedSurveyQuestion[] = [
	{ id: 'education', question: 'What is your highest education level?' },
	{ id: 'age', question: 'Which age group do you belong to?' },
	{ id: 'recommend', question: 'How likely are you to recommend us?' },
];

function renderPane( props: Partial< SelectedQuestionsPaneProps > = {} ) {
	return render(
		<SelectedQuestionsPane
			onRemove={ jest.fn() }
			onReorder={ jest.fn() }
			questions={ questions }
			{ ...props }
		/>
	);
}

interface StatefulPaneProps {
	onRemove: ( questionID: string ) => void;
}

function StatefulPane( { onRemove }: StatefulPaneProps ) {
	const [ currentQuestions, setCurrentQuestions ] = useState( questions );

	return (
		<SelectedQuestionsPane
			onRemove={ ( questionID ) => {
				onRemove( questionID );
				setCurrentQuestions( ( previousQuestions ) =>
					previousQuestions.filter( ( { id } ) => id !== questionID )
				);
			} }
			onReorder={ setCurrentQuestions }
			questions={ currentQuestions }
		/>
	);
}

function getRemoveButtons() {
	return screen.getAllByRole( 'button', { name: 'Remove question' } );
}

function getListItemTexts() {
	return screen
		.getAllByRole( 'listitem' )
		.map( ( listItem ) => listItem.textContent );
}

describe( 'SelectedQuestionsPane', () => {
	// Provide our own version of the `useInstanceId()` hook to avoid instability in test snapshots.
	mockUseInstanceID();

	it( 'should render the title, description and illustration with no list when there are no questions', () => {
		const { container } = renderPane( { questions: [] } );

		expect(
			screen.getByRole( 'heading', { name: 'Selected questions' } )
		).toBeInTheDocument();

		expect(
			screen.getByText( 'You can remove or reorder your questions here' )
		).toBeInTheDocument();

		expect(
			container.querySelector(
				'.googlesitekit-rrm-selected-questions-pane__empty svg'
			)
		).toBeInTheDocument();

		expect( screen.queryByRole( 'list' ) ).not.toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the questions in the order given, each with a drag handle and a remove action and no expand control', () => {
		const { container } = renderPane();

		expect(
			container.querySelector(
				'.googlesitekit-rrm-selected-questions-pane__empty'
			)
		).not.toBeInTheDocument();

		expect( getListItemTexts() ).toEqual(
			questions.map( ( { question } ) => question )
		);

		screen.getAllByRole( 'listitem' ).forEach( ( listItem, index ) => {
			const item = within( listItem );

			expect(
				item.getByRole( 'button', {
					name: `Move question ${ index + 1 }`,
				} )
			).toBeInTheDocument();

			expect(
				item.getByRole( 'button', { name: 'Remove question' } )
			).toBeInTheDocument();

			expect( item.getAllByRole( 'button' ) ).toHaveLength( 2 );
		} );

		expect(
			container.querySelector( '[aria-expanded]' )
		).not.toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should report the removed question and move focus to the remove action that takes its place', () => {
		const onRemove = jest.fn();

		render( <StatefulPane onRemove={ onRemove } /> );

		fireEvent.click( getRemoveButtons()[ 0 ] );

		expect( onRemove ).toHaveBeenCalledTimes( 1 );
		expect( onRemove ).toHaveBeenCalledWith( 'education' );

		expect( getListItemTexts() ).toEqual( [
			questions[ 1 ].question,
			questions[ 2 ].question,
		] );

		expect( getRemoveButtons()[ 0 ] ).toHaveFocus();
	} );

	it( 'should move focus to the previous remove action when the last question is removed', () => {
		const onRemove = jest.fn();

		render( <StatefulPane onRemove={ onRemove } /> );

		fireEvent.click( getRemoveButtons()[ 2 ] );

		expect( onRemove ).toHaveBeenCalledWith( 'recommend' );
		expect( getRemoveButtons() ).toHaveLength( 2 );
		expect( getRemoveButtons()[ 1 ] ).toHaveFocus();
	} );

	it( 'should move focus to the title when no questions remain', () => {
		const onRemove = jest.fn();

		render( <StatefulPane onRemove={ onRemove } /> );

		fireEvent.click( getRemoveButtons()[ 0 ] );
		fireEvent.click( getRemoveButtons()[ 0 ] );
		fireEvent.click( getRemoveButtons()[ 0 ] );

		expect( onRemove ).toHaveBeenCalledTimes( 3 );
		expect( screen.queryByRole( 'list' ) ).not.toBeInTheDocument();

		expect(
			screen.getByRole( 'heading', { name: 'Selected questions' } )
		).toHaveFocus();
	} );

	it( 'should not move focus when the parent keeps the question', () => {
		renderPane();

		const removeButton = getRemoveButtons()[ 1 ];

		removeButton.focus();
		fireEvent.click( removeButton );

		expect( removeButton ).toHaveFocus();
	} );

	it( 'should name the drag handles after the current order of the questions', () => {
		const { rerender } = renderPane();

		const reorderedQuestions = [
			questions[ 2 ],
			questions[ 0 ],
			questions[ 1 ],
		];

		rerender(
			<SelectedQuestionsPane
				onRemove={ jest.fn() }
				onReorder={ jest.fn() }
				questions={ reorderedQuestions }
			/>
		);

		expect( getListItemTexts() ).toEqual(
			reorderedQuestions.map( ( { question } ) => question )
		);

		screen.getAllByRole( 'listitem' ).forEach( ( listItem, index ) => {
			expect(
				within( listItem ).getByRole( 'button', {
					name: `Move question ${ index + 1 }`,
				} )
			).toBeInTheDocument();
		} );
	} );

	it( 'should report the new order when a handle is moved down with the arrow key', () => {
		const onReorder = jest.fn();

		renderPane( { onReorder } );

		fireEvent.keyDown(
			screen.getByRole( 'button', { name: 'Move question 1' } ),
			{ key: 'ArrowDown' }
		);

		expect( onReorder ).toHaveBeenCalledTimes( 1 );
		expect( onReorder ).toHaveBeenCalledWith( [
			questions[ 1 ],
			questions[ 0 ],
			questions[ 2 ],
		] );
	} );

	it( 'should report the new order when a handle is moved up with the arrow key', () => {
		const onReorder = jest.fn();

		renderPane( { onReorder } );

		fireEvent.keyDown(
			screen.getByRole( 'button', { name: 'Move question 3' } ),
			{ key: 'ArrowUp' }
		);

		expect( onReorder ).toHaveBeenCalledTimes( 1 );
		expect( onReorder ).toHaveBeenCalledWith( [
			questions[ 0 ],
			questions[ 2 ],
			questions[ 1 ],
		] );
	} );

	it( 'should highlight only the question matching highlightedQuestionID', () => {
		const { container } = renderPane( { highlightedQuestionID: 'age' } );

		const highlightedRows = container.querySelectorAll(
			'.googlesitekit-rrm-survey-question-row--is-highlighted'
		);

		expect( highlightedRows ).toHaveLength( 1 );
		expect( highlightedRows[ 0 ] ).toHaveTextContent(
			questions[ 1 ].question
		);
	} );

	it( 'should highlight no question without highlightedQuestionID', () => {
		const { container } = renderPane();

		expect(
			container.querySelector(
				'.googlesitekit-rrm-survey-question-row--is-highlighted'
			)
		).not.toBeInTheDocument();
	} );
} );
