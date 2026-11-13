/**
 * Survey CTA type handler tests.
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
import surveyCTATypeHandler from './survey';

describe( 'modules/reader-revenue-manager survey CTA type', () => {
	const { validateConfig } = surveyCTATypeHandler;

	const presetQuestion = { presetQuestion: { questionId: 1 } };

	const customQuestion = {
		customQuestion: {
			displayText: 'Would you recommend us?',
			categoryLabel: 'Recommendation',
			answerChoices: [ { displayText: 'Yes' }, { displayText: 'No' } ],
		},
	};

	function withQuestion( question: unknown ) {
		return { questions: [ question ] };
	}

	function withCustomQuestion( fields: unknown ) {
		return withQuestion( { customQuestion: fields } );
	}

	it( 'should accept preset questions, with and without answer IDs', () => {
		expect( () =>
			validateConfig( {
				customMessage: 'Help us learn more about you',
				questions: [
					{
						presetQuestion: {
							questionId: 3,
							answerIds: [ 12, 10, 11 ],
						},
					},
					presetQuestion,
				],
			} )
		).not.toThrow();
	} );

	it( 'should accept custom questions, with and without their optional fields', () => {
		expect( () =>
			validateConfig( {
				questions: [
					customQuestion,
					{
						customQuestion: {
							answerChoices: [
								{ displayText: 'Yes' },
								{ displayText: 'No' },
							],
						},
					},
				],
			} )
		).not.toThrow();
	} );

	it( 'should accept preset and custom questions together, without changing their order', () => {
		const config = {
			questions: [ customQuestion, presetQuestion, customQuestion ],
		};
		const originalConfig = JSON.parse( JSON.stringify( config ) );

		expect( () => validateConfig( config ) ).not.toThrow();
		expect( config ).toEqual( originalConfig );
	} );

	it( 'should accept an empty question list for a draft', () => {
		expect( () => validateConfig( { questions: [] } ) ).not.toThrow();
	} );

	it.each( [
		[ 'not an object', 'not-an-object' ],
		[ 'an array', [] ],
		[ 'undefined', undefined ],
	] )( 'should throw when the config is %s', ( _, config ) => {
		expect( () => validateConfig( config ) ).toThrow(
			'config is required and must be an object.'
		);
	} );

	it.each( [
		[
			'an unsupported config field',
			{ questions: [], unknownSetting: 'value' },
			'config contains unsupported fields.',
		],
		[
			'the response-only report URL',
			{
				questions: [],
				reportUrl: 'https://lookerstudio.google.com/reporting/1',
			},
			'config contains unsupported fields.',
		],
		[
			'a custom message that is not a string',
			{ customMessage: 123, questions: [] },
			'config.customMessage must be a string.',
		],
		[
			'no questions',
			{ customMessage: 'Help us learn more about you' },
			'config.questions must be an array.',
		],
		[
			'questions that are not an array',
			{ questions: { first: presetQuestion } },
			'config.questions must be an array.',
		],
		[
			'a question that is not an object',
			withQuestion( 'not-an-object' ),
			'config.questions[0] must be an object.',
		],
		[
			'a question without a variant',
			{ questions: [ presetQuestion, {} ] },
			'config.questions[1] must contain exactly one of presetQuestion or customQuestion.',
		],
		[
			'a question with both variants',
			withQuestion( { ...presetQuestion, ...customQuestion } ),
			'config.questions[0] must contain exactly one of presetQuestion or customQuestion.',
		],
		[
			'an unsupported question field',
			withQuestion( { ...presetQuestion, id: 'question-1' } ),
			'config.questions[0] contains unsupported fields.',
		],
		[
			'a preset question that is not an object',
			withQuestion( { presetQuestion: 1 } ),
			'config.questions[0].presetQuestion must be an object.',
		],
		[
			'an unsupported preset question field',
			withQuestion( {
				presetQuestion: {
					questionId: 1,
					displayText: 'How old are you?',
				},
			} ),
			'config.questions[0].presetQuestion contains unsupported fields.',
		],
		[
			'a preset question without a question ID',
			withQuestion( { presetQuestion: { answerIds: [ 1, 2 ] } } ),
			'config.questions[0].presetQuestion.questionId must be an integer.',
		],
		[
			'a preset question ID that is not an integer',
			withQuestion( { presetQuestion: { questionId: '1' } } ),
			'config.questions[0].presetQuestion.questionId must be an integer.',
		],
		[
			'preset answer IDs that are not an array',
			withQuestion( { presetQuestion: { questionId: 1, answerIds: 2 } } ),
			'config.questions[0].presetQuestion.answerIds must be an array of integers.',
		],
		[
			'a preset answer ID that is not an integer',
			withQuestion( {
				presetQuestion: { questionId: 1, answerIds: [ 1, 2.5 ] },
			} ),
			'config.questions[0].presetQuestion.answerIds must be an array of integers.',
		],
		[
			'the response-only custom question ID',
			withCustomQuestion( {
				id: 'custom-question-1',
				answerChoices: [ { displayText: 'Yes' } ],
			} ),
			'config.questions[0].customQuestion contains unsupported fields.',
		],
		[
			'custom question text that is not a string',
			withCustomQuestion( {
				displayText: 123,
				answerChoices: [ { displayText: 'Yes' } ],
			} ),
			'config.questions[0].customQuestion.displayText must be a string.',
		],
		[
			'a custom question category that is not a string',
			withCustomQuestion( {
				categoryLabel: 123,
				answerChoices: [ { displayText: 'Yes' } ],
			} ),
			'config.questions[0].customQuestion.categoryLabel must be a string.',
		],
		[
			'a custom question without answer choices',
			withCustomQuestion( { displayText: 'Would you recommend us?' } ),
			'config.questions[0].customQuestion.answerChoices must be an array.',
		],
		[
			'custom answer choices that are not an array',
			withCustomQuestion( { answerChoices: 'Yes' } ),
			'config.questions[0].customQuestion.answerChoices must be an array.',
		],
		[
			'a custom answer choice that is not an object',
			withCustomQuestion( { answerChoices: [ 'Yes' ] } ),
			'config.questions[0].customQuestion.answerChoices[0] must be an object.',
		],
		[
			'an unsupported custom answer choice field',
			withCustomQuestion( {
				answerChoices: [ { displayText: 'Yes', id: 1 } ],
			} ),
			'config.questions[0].customQuestion.answerChoices[0] contains unsupported fields.',
		],
		[
			'a custom answer choice without text',
			withCustomQuestion( {
				answerChoices: [ { displayText: 'Yes' }, {} ],
			} ),
			'config.questions[0].customQuestion.answerChoices[1].displayText must be a string.',
		],
	] )( 'should throw for %s', ( _, config, message ) => {
		expect( () => validateConfig( config ) ).toThrow( message );
	} );
} );
