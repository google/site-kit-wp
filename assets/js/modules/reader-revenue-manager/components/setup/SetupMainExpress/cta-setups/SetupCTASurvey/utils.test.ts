/**
 * Reader Revenue Manager survey CTA setup utility tests.
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
 * Internal dependencies
 */
import { surveyQuestionCatalog } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import { type CustomQuestion } from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import {
	createCustomQuestionID,
	createPresetQuestionEntry,
	getCatalogQuestionAnswers,
	getCustomQuestionAnswers,
	getDefaultPresetAnswerIDs,
	getPresetQuestionID,
	getQuestionText,
	toCustomQuestion,
	toCustomSurveyQuestion,
} from './utils';

describe( 'SetupCTASurvey utils', () => {
	const configurableQuestion = surveyQuestionCatalog.find(
		( { hasConfigurableAnswers, answers } ) =>
			hasConfigurableAnswers && answers.length > 5
	)!;
	const demographicQuestion = surveyQuestionCatalog.find(
		( { hasConfigurableAnswers } ) => ! hasConfigurableAnswers
	)!;

	const customQuestion: CustomQuestion = {
		displayText: 'How did you find us?',
		categoryLabel: 'Acquisition',
		answerChoices: [
			{ displayText: 'Search' },
			{ displayText: 'Social media' },
		],
	};

	describe( 'getPresetQuestionID', () => {
		it( 'returns the local ID of a predefined question', () => {
			expect( getPresetQuestionID( 12 ) ).toBe( 'preset-12' );
		} );
	} );

	describe( 'createCustomQuestionID', () => {
		it( 'returns a new custom question ID on each call', () => {
			const first = createCustomQuestionID();
			const second = createCustomQuestionID();

			expect( first ).toMatch( /^custom-question-\d+$/ );
			expect( second ).toMatch( /^custom-question-\d+$/ );
			expect( first ).not.toBe( second );
		} );
	} );

	describe( 'toCustomSurveyQuestion', () => {
		it( 'converts a custom question to the side sheet shape', () => {
			expect( toCustomSurveyQuestion( customQuestion ) ).toEqual( {
				question: 'How did you find us?',
				answers: [ 'Search', 'Social media' ],
				category: 'Acquisition',
			} );
		} );

		it( 'uses empty strings for a missing question text and category', () => {
			expect(
				toCustomSurveyQuestion( {
					answerChoices: [ { displayText: 'Yes' } ],
				} )
			).toEqual( {
				question: '',
				answers: [ 'Yes' ],
				category: '',
			} );
		} );
	} );

	describe( 'toCustomQuestion', () => {
		it( 'converts a side sheet question to the API shape', () => {
			expect(
				toCustomQuestion( {
					question: 'How did you find us?',
					answers: [ 'Search', 'Social media' ],
					category: 'Acquisition',
				} )
			).toEqual( customQuestion );
		} );

		it.each( [
			[ 'empty', '' ],
			[ 'blank', '   ' ],
			[ 'missing', undefined ],
		] )( 'leaves out the category when it is %s', ( _, category ) => {
			const question = toCustomQuestion( {
				question: 'Question',
				answers: [ 'A', 'B' ],
				category,
			} );

			expect( question ).toEqual( {
				displayText: 'Question',
				answerChoices: [ { displayText: 'A' }, { displayText: 'B' } ],
			} );
			expect( question ).not.toHaveProperty( 'categoryLabel' );
		} );
	} );

	describe( 'getQuestionText', () => {
		it( 'returns the text of a custom question', () => {
			expect(
				getQuestionText(
					{ id: 'custom-question-1', question: { customQuestion } },
					surveyQuestionCatalog
				)
			).toBe( 'How did you find us?' );
		} );

		it( 'returns the catalog label of a predefined question', () => {
			expect(
				getQuestionText(
					createPresetQuestionEntry( demographicQuestion ),
					surveyQuestionCatalog
				)
			).toBe( demographicQuestion.label );
		} );

		it( 'returns `undefined` for a predefined question that is not in the catalog', () => {
			expect(
				getQuestionText(
					{
						id: 'preset-9999',
						question: { presetQuestion: { questionId: 9999 } },
					},
					surveyQuestionCatalog
				)
			).toBeUndefined();
		} );
	} );

	describe( 'getCustomQuestionAnswers', () => {
		it( 'uses the index of each answer as its ID', () => {
			expect( getCustomQuestionAnswers( customQuestion ) ).toEqual( [
				{ id: '0', label: 'Search' },
				{ id: '1', label: 'Social media' },
			] );
		} );
	} );

	describe( 'getCatalogQuestionAnswers', () => {
		it( 'turns the numeric answer IDs into strings', () => {
			const answers = getCatalogQuestionAnswers( configurableQuestion );

			expect( answers ).toEqual(
				configurableQuestion.answers.map( ( { id, label } ) => ( {
					id: String( id ),
					label,
				} ) )
			);
		} );
	} );

	describe( 'getDefaultPresetAnswerIDs', () => {
		it( 'returns the first five answers of a longer list', () => {
			expect( getDefaultPresetAnswerIDs( configurableQuestion ) ).toEqual(
				configurableQuestion.answers
					.slice( 0, 5 )
					.map( ( { id } ) => String( id ) )
			);
		} );

		it( 'returns every answer of a shorter list', () => {
			expect(
				getDefaultPresetAnswerIDs( {
					id: 1,
					label: 'Question',
					answers: [
						{ id: 3, label: 'A' },
						{ id: 4, label: 'B' },
					],
					hasConfigurableAnswers: true,
				} )
			).toEqual( [ '3', '4' ] );
		} );
	} );

	describe( 'createPresetQuestionEntry', () => {
		it( 'saves the chosen answers as numbers for a question with configurable answers', () => {
			expect(
				createPresetQuestionEntry( configurableQuestion, [ '3', '7' ] )
			).toEqual( {
				id: `preset-${ configurableQuestion.id }`,
				question: {
					presetQuestion: {
						questionId: configurableQuestion.id,
						answerIds: [ 3, 7 ],
					},
				},
			} );
		} );

		it( 'leaves out the answers for a question without configurable answers', () => {
			const entry = createPresetQuestionEntry( demographicQuestion, [
				'1',
				'2',
			] );

			expect( entry ).toEqual( {
				id: `preset-${ demographicQuestion.id }`,
				question: {
					presetQuestion: { questionId: demographicQuestion.id },
				},
			} );
			expect( entry.question.presetQuestion ).not.toHaveProperty(
				'answerIds'
			);
		} );
	} );
} );
