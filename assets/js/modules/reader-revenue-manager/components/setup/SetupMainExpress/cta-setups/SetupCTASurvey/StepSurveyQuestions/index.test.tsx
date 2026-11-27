/**
 * StepSurveyQuestions component tests.
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

// The survey configuration uses the field names of the `webcontentpublisher` API.
/* eslint-disable sitekit/acronym-case */

/**
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import { Registry, Select } from '@/js/googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { SURVEY_FORM } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { surveyQuestionCatalog } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	EXPRESS_SETUP_CTA_FORMS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	render,
	screen,
	waitFor,
	within,
} from '@tests/js/test-utils';
import StepSurveyQuestions, { surveyQuestionsStep } from '.';

const LIMIT_MESSAGE =
	'You’ve reached the maximum of 3 questions per survey. To add a question, remove a question first.';

const params = {
	organizationID: 'ABCD1234',
	publicationID: 'ABCD_123-4',
};

const catalogEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/survey-question-catalog'
);

const [ topicsQuestion, ageQuestion, frequencyQuestion, genderQuestion ] =
	surveyQuestionCatalog;

// eslint-disable-next-line sitekit/acronym-case
function type( element: HTMLElement, value: string ) {
	fireEvent.change( element, { target: { value } } );
}

function getGroup( name: string ) {
	return screen.getByRole( 'region', { name } );
}

function getPane() {
	return getGroup( 'Selected questions' );
}

function getLeftRow( question: string ) {
	return screen
		.getByRole( 'button', { name: question } )
		.closest( '.googlesitekit-rrm-survey-question-row' ) as HTMLElement;
}

function getAddButton( question: string ) {
	return within( getLeftRow( question ) ).getByRole( 'button', {
		name: 'Add question',
	} );
}

function getLeftRemoveButton( question: string ) {
	return within( getLeftRow( question ) ).getByRole( 'button', {
		name: 'Remove question',
	} );
}

function getPaneRemoveButton( question: string ) {
	return within( getPaneRow( question ) ).getByRole( 'button', {
		name: 'Remove question',
	} );
}

function getPaneQuestions() {
	return Array.from(
		getPane().querySelectorAll(
			'.googlesitekit-rrm-survey-question-row__question'
		)
	).map( ( element ) => element.textContent );
}

function getPaneRow( question: string ) {
	return within( getPane() )
		.getByText( question )
		.closest( '.googlesitekit-rrm-survey-question-row' ) as HTMLElement;
}

function toggleQuestion( question: string ) {
	fireEvent.click( screen.getByRole( 'button', { name: question } ) );
}

function getCreateNewButton() {
	return screen.getByRole( 'button', { name: /^Create new/ } );
}

function createCustomQuestion( question: string, answers: string[] ) {
	fireEvent.click( getCreateNewButton() );

	type( screen.getByLabelText( 'Add your question' ), question );

	answers.forEach( ( answer, index ) =>
		type(
			screen.getAllByRole( 'textbox', { name: /^Answer \d$/ } )[ index ],
			answer
		)
	);

	type( screen.getByLabelText( 'Add a category (optional)' ), 'Interests' );

	fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
}

describe( 'StepSurveyQuestions', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		const moduleData = [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: true,
			},
		];

		provideModules( registry, moduleData );
		provideModuleRegistrations( registry, moduleData );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( params );
	} );

	afterEach( () => {
		document.body.classList.remove(
			'googlesitekit-side-sheet-scroll-lock'
		);
	} );

	function provideCatalog() {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublicationSurveyQuestionCatalog(
				surveyQuestionCatalog,
				params
			);
	}

	function renderStep( props = {} ) {
		return render(
			<StepSurveyQuestions
				onComplete={ jest.fn() }
				onGoBack={ jest.fn() }
				{ ...props }
			/>,
			{ registry }
		);
	}

	function getSelectedQuestions() {
		return registry
			.select( CORE_FORMS )
			.getValue(
				EXPRESS_SETUP_CTA_FORMS.SURVEY,
				SURVEY_FORM.SELECTED_QUESTIONS
			);
	}

	it( 'shows a progress bar while the catalog is loading', () => {
		freezeFetch( catalogEndpoint );

		renderStep();

		expect( screen.getByRole( 'progressbar' ) ).toBeInTheDocument();
		expect(
			screen.queryByText( 'Select up to 3 questions for your survey' )
		).not.toBeInTheDocument();
	} );

	it( 'renders the step with the catalog questions in catalog order', () => {
		provideCatalog();

		renderStep();

		expect(
			screen.getByText( 'Select up to 3 questions for your survey' )
		).toBeInTheDocument();
		expect(
			screen.getByText(
				'Create custom questions or select from the list below'
			)
		).toBeInTheDocument();
		expect( getGroup( 'Custom questions' ) ).toBeInTheDocument();
		expect( getCreateNewButton() ).toBeEnabled();
		expect( getPane() ).toBeInTheDocument();

		const expandButtons = within(
			getGroup( 'Predefined questions' )
		).getAllByRole( 'button', { expanded: false } );

		expect( expandButtons.map( ( button ) => button.textContent ) ).toEqual(
			surveyQuestionCatalog.map( ( { label } ) => label )
		);

		expect( screen.getByRole( 'button', { name: 'Next' } ) ).toBeDisabled();
	} );

	it( 'shows the error notice with Retry in place of the questions when the catalog fails, and loads it again on Retry', async () => {
		const error = {
			code: 'internal_server_error',
			message: 'Internal server error',
			data: { status: 500, reason: 'internalError' },
		};

		// The error notice scrolls itself into view, which jsdom lacks.
		Element.prototype.scrollIntoView = jest.fn();

		fetchMock.getOnce( catalogEndpoint, { body: error, status: 500 } );

		const onComplete = jest.fn();

		renderStep( { onComplete } );

		expect(
			await screen.findByText( /Internal server error/ )
		).toBeInTheDocument();
		expect( console ).toHaveErrored();

		expect(
			screen.getByText( 'Select up to 3 questions for your survey' )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'region', { name: 'Predefined questions' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'region', { name: 'Selected questions' } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Next' } ) ).toBeDisabled();

		fetchMock.getOnce( catalogEndpoint, {
			body: surveyQuestionCatalog,
			status: 200,
		} );

		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect(
			await screen.findByRole( 'region', {
				name: 'Predefined questions',
			} )
		).toBeInTheDocument();
		expect( fetchMock ).toHaveFetchedTimes( 2 );

		// Retry sits inside the step's form, so its click submits the form.
		expect( onComplete ).not.toHaveBeenCalled();
	} );

	describe( 'with the catalog', () => {
		beforeEach( () => {
			provideCatalog();
		} );

		it( 'adds questions to the end of the selection and shows them as added', () => {
			renderStep();

			fireEvent.click( getAddButton( ageQuestion.label ) );
			fireEvent.click( getAddButton( topicsQuestion.label ) );

			expect( getPaneQuestions() ).toEqual( [
				ageQuestion.label,
				topicsQuestion.label,
			] );
			expect(
				getLeftRemoveButton( ageQuestion.label )
			).toBeInTheDocument();
		} );

		it( 'removes questions from either column', () => {
			renderStep();

			fireEvent.click( getAddButton( ageQuestion.label ) );
			fireEvent.click( getAddButton( genderQuestion.label ) );

			fireEvent.click( getPaneRemoveButton( ageQuestion.label ) );

			expect( getPaneQuestions() ).toEqual( [ genderQuestion.label ] );
			expect( getAddButton( ageQuestion.label ) ).toBeEnabled();

			fireEvent.click( getLeftRemoveButton( genderQuestion.label ) );

			expect( getPaneQuestions() ).toEqual( [] );
			expect( getAddButton( genderQuestion.label ) ).toBeEnabled();
		} );

		it( 'reorders the questions in the pane', () => {
			renderStep();

			fireEvent.click( getAddButton( ageQuestion.label ) );
			fireEvent.click( getAddButton( genderQuestion.label ) );

			fireEvent.keyDown(
				screen.getByRole( 'button', { name: 'Move question 1' } ),
				{ key: 'ArrowDown' }
			);

			expect( getPaneQuestions() ).toEqual( [
				genderQuestion.label,
				ageQuestion.label,
			] );
			expect(
				getSelectedQuestions().map( ( { id }: { id: string } ) => id )
			).toEqual( [
				`preset-${ genderQuestion.id }`,
				`preset-${ ageQuestion.id }`,
			] );
		} );

		it( 'disables the add actions and Create new at three questions, and enables them after a removal', () => {
			renderStep();

			fireEvent.click( getAddButton( topicsQuestion.label ) );
			fireEvent.click( getAddButton( ageQuestion.label ) );
			fireEvent.click( getAddButton( frequencyQuestion.label ) );

			const genderAddButton = getAddButton( genderQuestion.label );

			expect( genderAddButton ).toBeDisabled();
			expect( genderAddButton ).toHaveAccessibleDescription(
				`${ LIMIT_MESSAGE } ${ genderQuestion.label }`
			);
			expect( getCreateNewButton() ).toBeDisabled();
			expect( getCreateNewButton() ).toHaveAccessibleDescription(
				LIMIT_MESSAGE
			);

			fireEvent.click( getLeftRemoveButton( ageQuestion.label ) );

			expect( getAddButton( genderQuestion.label ) ).toBeEnabled();
			expect(
				getAddButton( genderQuestion.label )
			).not.toHaveAccessibleDescription(
				expect.stringContaining( LIMIT_MESSAGE )
			);
			expect( getCreateNewButton() ).toBeEnabled();
			expect( getCreateNewButton() ).not.toHaveAccessibleDescription();
		} );

		it( 'shows the limit tooltip when hovering over Create new at three questions', async () => {
			renderStep();

			fireEvent.click( getAddButton( topicsQuestion.label ) );
			fireEvent.click( getAddButton( ageQuestion.label ) );
			fireEvent.click( getAddButton( frequencyQuestion.label ) );

			fireEvent.mouseOver( getCreateNewButton() );

			expect( await screen.findByRole( 'tooltip' ) ).toHaveTextContent(
				LIMIT_MESSAGE
			);
		} );

		it( 'highlights an expanded selected question in the pane', () => {
			renderStep();

			fireEvent.click( getAddButton( ageQuestion.label ) );

			const highlightedClass =
				'googlesitekit-rrm-survey-question-row--is-highlighted';

			toggleQuestion( ageQuestion.label );
			expect( getPaneRow( ageQuestion.label ) ).toHaveClass(
				highlightedClass
			);

			toggleQuestion( ageQuestion.label );
			expect( getPaneRow( ageQuestion.label ) ).not.toHaveClass(
				highlightedClass
			);

			toggleQuestion( ageQuestion.label );
			expect( getPaneRow( ageQuestion.label ) ).toHaveClass(
				highlightedClass
			);

			// Expanding a question that is not selected removes the highlight.
			toggleQuestion( genderQuestion.label );
			expect( getPaneRow( ageQuestion.label ) ).not.toHaveClass(
				highlightedClass
			);
		} );

		it( 'shows the answers of a question without configurable answers as a list with the demographic note', () => {
			renderStep();

			toggleQuestion( ageQuestion.label );

			const row = getLeftRow( ageQuestion.label );

			expect( within( row ).queryAllByRole( 'checkbox' ) ).toHaveLength(
				0
			);
			expect( within( row ).getAllByRole( 'listitem' ) ).toHaveLength(
				ageQuestion.answers.length
			);
			expect(
				within( row ).getByText(
					'Predefined demographic question answers can’t be edited to help maintain consistency for audience segmentation.'
				)
			).toBeInTheDocument();
		} );

		it( 'checks the first five answers of a configurable question and disables checkboxes at the limits', () => {
			renderStep();

			toggleQuestion( topicsQuestion.label );

			const row = getLeftRow( topicsQuestion.label );

			expect(
				within( row ).getByText(
					'Predefined questions can’t be edited. Choose 2 to 5 answers to show your readers.'
				)
			).toBeInTheDocument();

			const checkboxes = within( row ).getAllByRole( 'checkbox' );

			expect( checkboxes ).toHaveLength( 7 );
			checkboxes.slice( 0, 5 ).forEach( ( checkbox ) => {
				expect( checkbox ).toBeChecked();
				expect( checkbox ).toBeEnabled();
			} );
			checkboxes.slice( 5 ).forEach( ( checkbox ) => {
				expect( checkbox ).not.toBeChecked();
				expect( checkbox ).toBeDisabled();
			} );

			fireEvent.click( checkboxes[ 0 ] );
			fireEvent.click( checkboxes[ 1 ] );
			fireEvent.click( checkboxes[ 2 ] );

			const updated = within( row ).getAllByRole(
				'checkbox'
			) as HTMLInputElement[];

			expect( updated.filter( ( c ) => c.checked ) ).toHaveLength( 2 );
			updated.forEach( ( checkbox ) => {
				if ( checkbox.checked ) {
					expect( checkbox ).toBeDisabled();
				} else {
					expect( checkbox ).toBeEnabled();
				}
			} );

			// Adding the question copies its chosen answers into the selection.
			fireEvent.click( getAddButton( topicsQuestion.label ) );

			expect( getSelectedQuestions() ).toEqual( [
				{
					id: `preset-${ topicsQuestion.id }`,
					question: {
						presetQuestion: {
							questionId: topicsQuestion.id,
							answerIds: [ 4, 5 ],
						},
					},
				},
			] );

			// Changing the answers of a selected question updates its entry.
			fireEvent.click( within( row ).getAllByRole( 'checkbox' )[ 6 ] );

			expect( getSelectedQuestions() ).toEqual( [
				{
					id: `preset-${ topicsQuestion.id }`,
					question: {
						presetQuestion: {
							questionId: topicsQuestion.id,
							answerIds: [ 4, 5, 7 ],
						},
					},
				},
			] );
		} );

		it( 'creates a custom question, edits it in place, and keeps it after it is removed', () => {
			renderStep();

			fireEvent.click( getAddButton( ageQuestion.label ) );

			createCustomQuestion( 'How did you find us?', [
				'Search',
				'Social media',
			] );

			const customGroup = getGroup( 'Custom questions' );

			expect(
				within( customGroup ).getByRole( 'button', {
					name: 'How did you find us?',
				} )
			).toBeInTheDocument();
			expect( getPaneQuestions() ).toEqual( [
				ageQuestion.label,
				'How did you find us?',
			] );

			fireEvent.click( getAddButton( genderQuestion.label ) );

			// Edit the custom question while it is selected.
			toggleQuestion( 'How did you find us?' );
			fireEvent.click(
				within( customGroup ).getByRole( 'button', { name: /Edit/ } )
			);

			expect( screen.getByLabelText( 'Add your question' ) ).toHaveValue(
				'How did you find us?'
			);

			type(
				screen.getByLabelText( 'Add your question' ),
				'Where did you hear about us?'
			);
			fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );

			expect(
				within( customGroup ).getByRole( 'button', {
					name: 'Where did you hear about us?',
				} )
			).toBeInTheDocument();
			expect( getPaneQuestions() ).toEqual( [
				ageQuestion.label,
				'Where did you hear about us?',
				genderQuestion.label,
			] );

			const [ , customEntry ] = getSelectedQuestions();

			expect( customEntry.id ).toMatch( /^custom-question-/ );
			expect( customEntry.question ).toEqual( {
				customQuestion: {
					displayText: 'Where did you hear about us?',
					answerChoices: [
						{ displayText: 'Search' },
						{ displayText: 'Social media' },
					],
					categoryLabel: 'Interests',
				},
			} );

			// Remove it from the selection; it stays in the group.
			fireEvent.click(
				getPaneRemoveButton( 'Where did you hear about us?' )
			);

			expect( getPaneQuestions() ).toEqual( [
				ageQuestion.label,
				genderQuestion.label,
			] );
			expect(
				within( customGroup ).getByRole( 'button', {
					name: 'Where did you hear about us?',
				} )
			).toBeInTheDocument();
			expect(
				getAddButton( 'Where did you hear about us?' )
			).toBeEnabled();
		} );

		it( 'keeps the selection in the form after the step mounts again', () => {
			const { unmount } = renderStep();

			fireEvent.click( getAddButton( frequencyQuestion.label ) );
			createCustomQuestion( 'How did you find us?', [
				'Search',
				'Social media',
			] );

			const selection = getSelectedQuestions();

			unmount();

			renderStep();

			expect( getSelectedQuestions() ).toEqual( selection );
			expect( getPaneQuestions() ).toEqual( [
				frequencyQuestion.label,
				'How did you find us?',
			] );
			expect( selection[ 0 ].question ).toEqual( {
				presetQuestion: {
					questionId: frequencyQuestion.id,
					answerIds: [ 1, 2, 3 ],
				},
			} );
			expect(
				within( getGroup( 'Custom questions' ) ).getByRole( 'button', {
					name: 'How did you find us?',
				} )
			).toBeInTheDocument();
		} );

		it( 'enables Next once a question is selected and completes the step', async () => {
			const onComplete = jest.fn();

			renderStep( { onComplete } );

			const nextButton = screen.getByRole( 'button', { name: 'Next' } );

			expect( nextButton ).toBeDisabled();

			fireEvent.click( getAddButton( ageQuestion.label ) );

			expect( nextButton ).toBeEnabled();

			fireEvent.click( nextButton );

			await waitFor( () => {
				expect( onComplete ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( 'does not complete the step when the custom question is saved', () => {
			const onComplete = jest.fn();

			renderStep( { onComplete } );

			createCustomQuestion( 'How did you find us?', [
				'Search',
				'Social media',
			] );

			expect( onComplete ).not.toHaveBeenCalled();
		} );

		it( 'leaves a predefined question that is not in the catalog out of the selected questions pane', () => {
			registry
				.dispatch( CORE_FORMS )
				.setValues( EXPRESS_SETUP_CTA_FORMS.SURVEY, {
					[ SURVEY_FORM.SELECTED_QUESTIONS ]: [
						{
							id: 'preset-9999',
							question: { presetQuestion: { questionId: 9999 } },
						},
						{
							id: `preset-${ ageQuestion.id }`,
							question: {
								presetQuestion: { questionId: ageQuestion.id },
							},
						},
					],
				} );

			renderStep();

			expect( getPaneQuestions() ).toEqual( [ ageQuestion.label ] );
		} );

		it( 'renders a back action that calls the back callback', () => {
			const onGoBack = jest.fn();
			const onComplete = jest.fn();

			renderStep( { onComplete, onGoBack } );

			fireEvent.click( screen.getByRole( 'button', { name: 'Back' } ) );

			expect( onGoBack ).toHaveBeenCalledTimes( 1 );
			expect( onComplete ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'surveyQuestionsStep.isComplete', () => {
		function isComplete() {
			return surveyQuestionsStep.isComplete?.(
				registry.select as Select
			);
		}

		it( 'returns `false` with no selected questions', () => {
			expect( isComplete() ).toBe( false );

			registry
				.dispatch( CORE_FORMS )
				.setValues( EXPRESS_SETUP_CTA_FORMS.SURVEY, {
					[ SURVEY_FORM.SELECTED_QUESTIONS ]: [],
				} );

			expect( isComplete() ).toBe( false );
		} );

		it( 'returns `true` with a selected question', () => {
			registry
				.dispatch( CORE_FORMS )
				.setValues( EXPRESS_SETUP_CTA_FORMS.SURVEY, {
					[ SURVEY_FORM.SELECTED_QUESTIONS ]: [
						{
							id: 'preset-1',
							question: { presetQuestion: { questionId: 1 } },
						},
					],
				} );

			expect( isComplete() ).toBe( true );
		} );
	} );
} );
