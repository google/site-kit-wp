/**
 * Survey CTA type handler.
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
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import {
	CTA_TYPES,
	type CallToActionBase,
	type CallToActionTypeHandler,
} from './types';

export interface PresetQuestion {
	questionId: number;
	answerIds?: number[];
}

export interface CustomAnswerChoice {
	displayText: string;
}

export interface CustomQuestion {
	displayText?: string;
	categoryLabel?: string;
	answerChoices: CustomAnswerChoice[];
}

export type SurveyQuestion =
	| { presetQuestion: PresetQuestion; customQuestion?: never }
	| { customQuestion: CustomQuestion; presetQuestion?: never };

export interface IdentifiedSurveyQuestion {
	id: string;
	question: SurveyQuestion;
}

export interface SurveyConfig {
	customMessage?: string;
	questions: SurveyQuestion[];
}

/**
 * A custom question as the API returns it, with its server-assigned `id`.
 */
export interface CustomQuestionResponse extends CustomQuestion {
	id?: string;
}

export type SurveyQuestionResponse =
	| { presetQuestion: PresetQuestion; customQuestion?: never }
	| { customQuestion: CustomQuestionResponse; presetQuestion?: never };

/**
 * A survey configuration as the API returns it, with its response-only fields.
 */
export interface SurveyConfigResponse {
	customMessage?: string;
	questions?: SurveyQuestionResponse[];
	reportUrl?: string;
}

export interface SurveyCTA extends CallToActionBase {
	type: typeof CTA_TYPES.SURVEY;
	surveyConfig?: SurveyConfigResponse;
}

const CONFIG_FIELDS = [ 'customMessage', 'questions' ];
const QUESTION_FIELDS = [ 'presetQuestion', 'customQuestion' ];
const PRESET_QUESTION_FIELDS = [ 'questionId', 'answerIds' ];
const CUSTOM_QUESTION_FIELDS = [
	'displayText',
	'categoryLabel',
	'answerChoices',
];
const CUSTOM_ANSWER_CHOICE_FIELDS = [ 'displayText' ];

/**
 * Validates that a value is an object with only supported fields.
 *
 * @since n.e.x.t
 *
 * @param  value           Value to validate.
 * @param  path            Path of the value in the configuration, for error messages.
 * @param  supportedFields Fields the object may contain.
 * @return {void}
 */
function validateObject(
	value: unknown,
	path: string,
	supportedFields: string[]
): asserts value is Record< string, unknown > {
	invariant( isPlainObject( value ), `${ path } must be an object.` );

	invariant(
		Object.keys( value as object ).every( ( field ) =>
			supportedFields.includes( field )
		),
		`${ path } contains unsupported fields.`
	);
}

/**
 * Validates an optional string field.
 *
 * @since n.e.x.t
 *
 * @param  value Value to validate.
 * @param  path  Path of the value in the configuration, for error messages.
 * @return {void}
 */
function validateOptionalString( value: unknown, path: string ): void {
	invariant(
		value === undefined || typeof value === 'string',
		`${ path } must be a string.`
	);
}

/**
 * Validates a preset survey question.
 *
 * @since n.e.x.t
 *
 * @param  presetQuestion Preset question to validate.
 * @param  path           Path of the question in the configuration, for error messages.
 * @return {void}
 */
function validatePresetQuestion( presetQuestion: unknown, path: string ): void {
	validateObject( presetQuestion, path, PRESET_QUESTION_FIELDS );

	const { questionId, answerIds } = presetQuestion;

	invariant(
		Number.isInteger( questionId ),
		`${ path }.questionId must be an integer.`
	);

	invariant(
		answerIds === undefined ||
			( Array.isArray( answerIds ) &&
				answerIds.every( Number.isInteger ) ),
		`${ path }.answerIds must be an array of integers.`
	);
}

/**
 * Validates a custom survey question.
 *
 * @since n.e.x.t
 *
 * @param  customQuestion Custom question to validate.
 * @param  path           Path of the question in the configuration, for error messages.
 * @return {void}
 */
function validateCustomQuestion( customQuestion: unknown, path: string ): void {
	validateObject( customQuestion, path, CUSTOM_QUESTION_FIELDS );

	const { displayText, categoryLabel, answerChoices } = customQuestion;

	validateOptionalString( displayText, `${ path }.displayText` );
	validateOptionalString( categoryLabel, `${ path }.categoryLabel` );

	invariant(
		Array.isArray( answerChoices ),
		`${ path }.answerChoices must be an array.`
	);

	answerChoices.forEach( ( answerChoice: unknown, index: number ) => {
		const answerChoicePath = `${ path }.answerChoices[${ index }]`;

		validateObject(
			answerChoice,
			answerChoicePath,
			CUSTOM_ANSWER_CHOICE_FIELDS
		);

		invariant(
			typeof answerChoice.displayText === 'string',
			`${ answerChoicePath }.displayText must be a string.`
		);
	} );
}

/**
 * Validates survey CTA configuration.
 *
 * Only the shape of the configuration is validated here. Limits that depend
 * on the CTA state or the question catalog, such as the number of questions
 * and answers, are left to the API.
 *
 * @since n.e.x.t
 *
 * @param  config CTA configuration.
 * @return {void}
 */
function validateSurveyConfig( config: unknown ): void {
	invariant(
		isPlainObject( config ),
		'config is required and must be an object.'
	);

	validateObject( config, 'config', CONFIG_FIELDS );

	const { customMessage, questions } = config;

	validateOptionalString( customMessage, 'config.customMessage' );

	invariant(
		Array.isArray( questions ),
		'config.questions must be an array.'
	);

	questions.forEach( ( question: unknown, index: number ) => {
		const questionPath = `config.questions[${ index }]`;

		validateObject( question, questionPath, QUESTION_FIELDS );

		const { presetQuestion, customQuestion } = question;

		invariant(
			( presetQuestion === undefined ) !==
				( customQuestion === undefined ),
			`${ questionPath } must contain exactly one of presetQuestion or customQuestion.`
		);

		if ( presetQuestion !== undefined ) {
			validatePresetQuestion(
				presetQuestion,
				`${ questionPath }.presetQuestion`
			);
		} else {
			validateCustomQuestion(
				customQuestion,
				`${ questionPath }.customQuestion`
			);
		}
	} );
}

export default {
	type: CTA_TYPES.SURVEY,
	validateConfig: validateSurveyConfig,
} as CallToActionTypeHandler< typeof CTA_TYPES.SURVEY >;
