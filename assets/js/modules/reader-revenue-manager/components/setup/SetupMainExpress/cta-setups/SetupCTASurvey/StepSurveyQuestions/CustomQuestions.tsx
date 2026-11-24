/**
 * Reader Revenue Manager survey questions step custom questions group.
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
import { Button } from 'googlesitekit-components';
import Typography from '@/js/components/Typography';
import { SIZE_LARGE, TYPE_LABEL } from '@/js/components/Typography/constants';
import MaybeTooltip from '@/js/googlesitekit/components-gm2/Button/MaybeTooltip';
import useFormValue from '@/js/hooks/useFormValue';
import { SURVEY_FORM } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/constants';
import CustomQuestionSideSheet from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/CustomQuestionSideSheet';
import { CustomSurveyQuestion } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/CustomQuestionSideSheet/types';
import SurveyQuestionRow from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/SurveyQuestionRow';
import {
	createCustomQuestionID,
	getCustomQuestionAnswers,
	toCustomQuestion,
	toCustomSurveyQuestion,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/utils';
import { EXPRESS_SETUP_CTA_FORMS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import {
	type CustomQuestion,
	type IdentifiedSurveyQuestion,
} from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import PlusIcon from '@/svg/icons/plus.svg';
import { QuestionGroupProps } from './types';

const CustomQuestions: FC< QuestionGroupProps > = ( {
	expandedIDs,
	isAtLimit,
	limitMessage,
	onAdd,
	onExpand,
	onRemove,
	onUpdate,
	selectedQuestions,
} ) => {
	const [ customQuestionsValue, setCustomQuestions ] = useFormValue<
		IdentifiedSurveyQuestion[]
	>( EXPRESS_SETUP_CTA_FORMS.SURVEY, SURVEY_FORM.CUSTOM_QUESTIONS );
	const customQuestions = customQuestionsValue || [];

	const [ isSideSheetOpen, setIsSideSheetOpen ] = useState( false );
	const [ editingID, setEditingID ] = useState< string >();

	const titleID = useInstanceId(
		CustomQuestions,
		'googlesitekit-rrm-survey-questions-step-custom-title'
	) as string;

	const limitMessageID = useInstanceId(
		CustomQuestions,
		'googlesitekit-rrm-survey-questions-step-create-limit'
	) as string;

	const editingEntry = editingID
		? customQuestions.find( ( { id } ) => id === editingID )
		: undefined;

	function openSideSheet( id?: string ) {
		setEditingID( id );
		setIsSideSheetOpen( true );
	}

	function closeSideSheet() {
		setIsSideSheetOpen( false );
	}

	function saveQuestion( question: CustomSurveyQuestion ) {
		const customQuestion = toCustomQuestion( question );

		if ( editingEntry ) {
			const entry: IdentifiedSurveyQuestion = {
				id: editingEntry.id,
				question: { customQuestion },
			};

			setCustomQuestions(
				customQuestions.map( ( customEntry ) =>
					customEntry.id === entry.id ? entry : customEntry
				)
			);
			onUpdate( entry );
			return;
		}

		const entry: IdentifiedSurveyQuestion = {
			id: createCustomQuestionID(),
			question: { customQuestion },
		};

		setCustomQuestions( [ ...customQuestions, entry ] );
		onAdd( entry );
	}

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
					{ __( 'Custom questions', 'google-site-kit' ) }
				</Typography>

				<MaybeTooltip
					// @ts-expect-error `MaybeTooltip` component is not yet typed.
					tooltipTitle={ isAtLimit ? limitMessage : undefined }
					tooltip
				>
					{ /* `Button` shows no tooltip while it is disabled. */ }
					<div className="googlesitekit-rrm-survey-questions-step__create">
						{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
						<Button
							aria-describedby={
								isAtLimit ? limitMessageID : undefined
							}
							disabled={ isAtLimit }
							icon={ <PlusIcon height={ 12 } width={ 12 } /> }
							onClick={ () => openSideSheet() }
							type="button"
							tertiary
						>
							{ __( 'Create new', 'google-site-kit' ) }
						</Button>
					</div>
				</MaybeTooltip>

				<span id={ limitMessageID } hidden>
					{ isAtLimit ? limitMessage : undefined }
				</span>
			</div>

			{ customQuestions.map( ( entry ) => {
				const customQuestion = entry.question
					.customQuestion as CustomQuestion;
				const isAdded = selectedQuestions.some(
					( { id } ) => id === entry.id
				);
				const isDisabled = isAtLimit && ! isAdded;

				return (
					<SurveyQuestionRow
						key={ entry.id }
						answers={ getCustomQuestionAnswers( customQuestion ) }
						disabled={ isDisabled }
						disabledMessage={
							isDisabled ? limitMessage : undefined
						}
						isAdded={ isAdded }
						isExpanded={ expandedIDs.includes( entry.id ) }
						onAdd={ () => onAdd( entry ) }
						onEdit={ () => openSideSheet( entry.id ) }
						onExpand={ ( isExpanded ) =>
							onExpand( entry.id, isExpanded )
						}
						onRemove={ () => onRemove( entry.id ) }
						question={ customQuestion.displayText || '' }
					/>
				);
			} ) }

			<CustomQuestionSideSheet
				isOpen={ isSideSheetOpen }
				onClose={ closeSideSheet }
				onSave={ saveQuestion }
				question={
					editingEntry?.question.customQuestion
						? toCustomSurveyQuestion(
								editingEntry.question.customQuestion
						  )
						: undefined
				}
			/>
		</section>
	);
};

export default CustomQuestions;
