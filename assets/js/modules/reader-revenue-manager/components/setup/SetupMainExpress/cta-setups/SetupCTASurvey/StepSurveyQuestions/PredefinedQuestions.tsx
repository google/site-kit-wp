/**
 * Reader Revenue Manager survey questions step predefined questions group.
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import { SIZE_LARGE, TYPE_LABEL } from '@/js/components/Typography/constants';
import {
	MAX_PRESET_ANSWERS,
	MIN_PRESET_ANSWERS,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/constants';
import SurveyQuestionRow from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/SurveyQuestionRow';
import { SurveyQuestionAnswer } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/SurveyQuestionRow/types';
import {
	createPresetQuestionEntry,
	getCatalogQuestionAnswers,
	getDefaultPresetAnswerIDs,
	getPresetQuestionID,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/utils';
import { type SurveyQuestion as CatalogQuestion } from '@/js/modules/reader-revenue-manager/datastore/types';
import { QuestionGroupProps } from './types';

interface PredefinedQuestionsProps extends QuestionGroupProps {
	catalog: CatalogQuestion[];
}

/**
 * Gets the answers of a question with configurable answers, disabling those
 * that cannot change without going past the limits.
 *
 * @since n.e.x.t
 *
 * @param  answers   Answers of the question.
 * @param  answerIDs IDs of the chosen answers.
 * @return {Array.<Object>} Answers for `SurveyQuestionRow`.
 */
function getConfigurableAnswers(
	answers: SurveyQuestionAnswer[],
	answerIDs: string[]
): SurveyQuestionAnswer[] {
	return answers.map( ( answer ) => {
		const isChecked = answerIDs.includes( answer.id );

		return {
			...answer,
			disabled: isChecked
				? answerIDs.length <= MIN_PRESET_ANSWERS
				: answerIDs.length >= MAX_PRESET_ANSWERS,
		};
	} );
}

const PredefinedQuestions: FC< PredefinedQuestionsProps > = ( {
	catalog,
	expandedIDs,
	isAtLimit,
	limitMessage,
	onAdd,
	onExpand,
	onRemove,
	onUpdate,
	selectedQuestions,
} ) => {
	// The chosen answers of each question, keyed by its local ID. A selected
	// question keeps them in its selection entry too.
	const [ chosenAnswerIDs, setChosenAnswerIDs ] = useState<
		Record< string, string[] >
	>( {} );

	const titleID = useInstanceId(
		PredefinedQuestions,
		'googlesitekit-rrm-survey-questions-step-predefined-title'
	) as string;

	return (
		<section
			aria-labelledby={ titleID }
			className="googlesitekit-rrm-survey-questions-step__group"
		>
			<div className="googlesitekit-rrm-survey-questions-step__group-header">
				<Typography
					as="h3"
					className="googlesitekit-rrm-survey-questions-step__group-title"
					id={ titleID }
					size={ SIZE_LARGE }
					type={ TYPE_LABEL }
				>
					{ __( 'Predefined questions', 'google-site-kit' ) }
				</Typography>
			</div>

			{ catalog.map( ( catalogQuestion ) => {
				const id = getPresetQuestionID( catalogQuestion.id );
				const selectedEntry = selectedQuestions.find(
					( entry ) => entry.id === id
				);
				const isAdded = !! selectedEntry;
				const isDisabled = isAtLimit && ! isAdded;
				const answers = getCatalogQuestionAnswers( catalogQuestion );

				const answerIDs =
					selectedEntry?.question.presetQuestion?.answerIds?.map(
						String
					) ??
					chosenAnswerIDs[ id ] ??
					getDefaultPresetAnswerIDs( catalogQuestion );

				function onChange( value: string[] ) {
					setChosenAnswerIDs( {
						...chosenAnswerIDs,
						[ id ]: value,
					} );

					if ( isAdded ) {
						onUpdate(
							createPresetQuestionEntry( catalogQuestion, value )
						);
					}
				}

				return (
					<SurveyQuestionRow
						key={ id }
						answers={
							catalogQuestion.hasConfigurableAnswers
								? getConfigurableAnswers( answers, answerIDs )
								: answers
						}
						disabled={ isDisabled }
						disabledMessage={
							isDisabled ? limitMessage : undefined
						}
						isAdded={ isAdded }
						isExpanded={ expandedIDs.includes( id ) }
						note={
							catalogQuestion.hasConfigurableAnswers
								? __(
										'Predefined questions can’t be edited. Choose 2 to 5 answers to show your readers.',
										'google-site-kit'
								  )
								: __(
										'Predefined demographic question answers can’t be edited to help maintain consistency for audience segmentation.',
										'google-site-kit'
								  )
						}
						onAdd={ () =>
							onAdd(
								createPresetQuestionEntry(
									catalogQuestion,
									answerIDs
								)
							)
						}
						onChange={
							catalogQuestion.hasConfigurableAnswers
								? onChange
								: undefined
						}
						onExpand={ ( isExpanded ) =>
							onExpand( id, isExpanded )
						}
						onRemove={ () => onRemove( id ) }
						question={ catalogQuestion.label }
						value={
							catalogQuestion.hasConfigurableAnswers
								? answerIDs
								: undefined
						}
					/>
				);
			} ) }
		</section>
	);
};

export default PredefinedQuestions;
