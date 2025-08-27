/**
 * SurveyQuestion component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SurveyQuestionRating from '@/js/components/surveys/SurveyQuestionRating';
import SurveyQuestionOpenText from '@/js/components/surveys/SurveyQuestionOpenText';
import SurveyQuestionMultiSelect from '@/js/components/surveys/SurveyQuestionMultiSelect';
import SurveyQuestionSingleSelect from '@/js/components/surveys/SurveyQuestionSingleSelect';
import { SURVEY_QUESTION_TYPE } from './constants';

export default function SurveyQuestion( {
	currentQuestion,
	answerQuestion,
	dismissSurvey,
	isLastQuestion,
} ) {
	const commonProps = {
		key: currentQuestion.question_text,
		answerQuestion,
		dismissSurvey,
		question: currentQuestion.question_text,
		submitButtonText: isLastQuestion
			? __( 'Submit', 'google-site-kit' )
			: __( 'Next', 'google-site-kit' ),
	};

	return (
		<Fragment>
			{ currentQuestion.question_type ===
				SURVEY_QUESTION_TYPE.MULTI_SELECT && (
				<SurveyQuestionMultiSelect
					{ ...commonProps }
					choices={ currentQuestion.question.answer_choice }
					minChoices={ currentQuestion.question.min_choices }
					maxChoices={ currentQuestion.question.max_choices }
				/>
			) }
			{ currentQuestion.question_type ===
				SURVEY_QUESTION_TYPE.OPEN_TEXT && (
				<SurveyQuestionOpenText
					{ ...commonProps }
					subtitle={ currentQuestion.question.subtitle }
					placeholder={ currentQuestion.question.placeholder }
				/>
			) }
			{ currentQuestion.question_type === SURVEY_QUESTION_TYPE.RATING && (
				<SurveyQuestionRating
					{ ...commonProps }
					choices={ currentQuestion.question.answer_choice }
				/>
			) }
			{ currentQuestion.question_type ===
				SURVEY_QUESTION_TYPE.SINGLE_SELECT && (
				<SurveyQuestionSingleSelect
					{ ...commonProps }
					choices={ currentQuestion.question.answer_choice }
				/>
			) }
		</Fragment>
	);
}

SurveyQuestion.propTypes = {
	currentQuestion: PropTypes.object.isRequired,
	answerQuestion: PropTypes.func.isRequired,
	dismissSurvey: PropTypes.func.isRequired,
	isLastQuestion: PropTypes.bool.isRequired,
};
