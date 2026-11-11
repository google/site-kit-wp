/**
 * CustomQuestionForm component.
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
import {
	ChangeEvent,
	FC,
	FormEvent,
	MutableRefObject,
	useCallback,
} from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, TextField } from 'googlesitekit-components';
import Notice from '@/js/components/Notice';
import {
	NOTICE_TYPES,
	NOTICE_VARIANTS,
} from '@/js/components/Notice/constants';
import RepeatableTextField from '@/js/components/RepeatableTextField/RepeatableTextField';
import { SelectionPanelHeader } from '@/js/components/SelectionPanel';
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_LABEL } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { CUSTOM_QUESTION_LIMITS } from './constants';
import { CustomQuestionAnswer, CustomSurveyQuestion } from './types';
import {
	createAnswer,
	getAnswerID,
	getAnswerLabel,
	getAnswerValue,
	getMoveAnswerLabel,
	getNewAnswer,
	getRemoveAnswerLabel,
	getUpdatedAnswer,
} from './utils';

interface CustomQuestionFormProps {
	onClose: () => void;
	onSave: ( question: CustomSurveyQuestion ) => void;
	question?: CustomSurveyQuestion;
	questionInputRef: MutableRefObject<
		HTMLInputElement | HTMLTextAreaElement | null
	>;
}

const CustomQuestionForm: FC< CustomQuestionFormProps > = ( {
	onClose,
	onSave,
	question,
	questionInputRef,
} ) => {
	const [ answers, setAnswers ] = useState< CustomQuestionAnswer[] >( () =>
		question?.answers.length
			? question.answers.map( createAnswer )
			: Array( CUSTOM_QUESTION_LIMITS.MINIMUM_ANSWERS )
					.fill( null )
					.map( getNewAnswer )
	);

	const [ category, setCategory ] = useState< string >(
		question?.category ?? ''
	);

	const [ questionText, setQuestionText ] = useState(
		question?.question ?? ''
	);

	const captureQuestionField = useCallback(
		( element: HTMLInputElement | HTMLTextAreaElement | null ) => {
			questionInputRef.current = element;
		},
		[ questionInputRef ]
	);

	const trimmedAnswers = answers
		.map( ( a ) => a.value.trim() )
		.filter( Boolean );

	const trimmedCategory = category.trim();
	const trimmedQuestionText = questionText.trim();

	const isDisabled =
		! trimmedQuestionText ||
		answers.length < CUSTOM_QUESTION_LIMITS.MINIMUM_ANSWERS ||
		answers.length > trimmedAnswers.length;

	function onChangeCategory( event: ChangeEvent< HTMLInputElement > ) {
		setCategory( event.target.value );
	}

	function onChangeQuestion( event: ChangeEvent< HTMLInputElement > ) {
		setQuestionText( event.target.value );
	}

	function onSubmit( event: FormEvent< HTMLFormElement > ) {
		event.preventDefault();

		onSave( {
			...question,
			answers: trimmedAnswers,
			category: trimmedCategory,
			question: trimmedQuestionText,
		} );

		onClose();
	}

	return (
		<form
			className="googlesitekit-rrm-custom-question-form"
			onSubmit={ onSubmit }
		>
			<div className="googlesitekit-rrm-custom-question-form__content">
				<SelectionPanelHeader
					onCloseClick={ onClose }
					title={ __(
						'Create a custom question',
						'google-site-kit'
					) }
				/>

				<div className="googlesitekit-rrm-custom-question-form__text-field">
					<TextField
						inputRef={ captureQuestionField }
						label={ __( 'Add your question', 'google-site-kit' ) }
						maxLength={ CUSTOM_QUESTION_LIMITS.QUESTION_LENGTH }
						onChange={ onChangeQuestion }
						value={ questionText }
						outlined
						showCharacterCounter
					/>
				</div>

				<div className="googlesitekit-rrm-custom-question-form__fields">
					<RepeatableTextField
						addItemLabel={ __( 'Add answer', 'google-site-kit' ) }
						className="googlesitekit-rrm-custom-question-form__answers"
						getItemID={ getAnswerID }
						getItemLabel={ getAnswerLabel }
						getItemValue={ getAnswerValue }
						getMoveItemLabel={ getMoveAnswerLabel }
						getNewItem={ getNewAnswer }
						getRemoveItemLabel={ getRemoveAnswerLabel }
						getUpdatedItem={ getUpdatedAnswer }
						items={ answers }
						legend={ __(
							'Add 2-5 answers, you can reorder them if needed',
							'google-site-kit'
						) }
						maxItems={ CUSTOM_QUESTION_LIMITS.MAXIMUM_ANSWERS }
						maxItemLength={ CUSTOM_QUESTION_LIMITS.ANSWER_LENGTH }
						onChange={ setAnswers }
					/>

					<div className="googlesitekit-rrm-custom-question-form__text-field">
						<TextField
							className="googlesitekit-rrm-custom-question-form__category"
							helperText={ __(
								'This will show up in your Analytics',
								'google-site-kit'
							) }
							label={ __(
								'Add a category (optional)',
								'google-site-kit'
							) }
							maxLength={ CUSTOM_QUESTION_LIMITS.CATEGORY_LENGTH }
							onChange={ onChangeCategory }
							value={ category }
							outlined
							showCharacterCounter
						/>
					</div>
				</div>
			</div>

			<footer className="googlesitekit-rrm-custom-question-form__footer">
				{ answers.length < CUSTOM_QUESTION_LIMITS.MINIMUM_ANSWERS && (
					<Notice
						className="googlesitekit-rrm-custom-question-form__notice"
						title={ sprintf(
							/* translators: %d: minimum answer count. */
							_n(
								'You need a minimum of %d answer',
								'You need a minimum of %d answers',
								CUSTOM_QUESTION_LIMITS.MINIMUM_ANSWERS,
								'google-site-kit'
							),
							CUSTOM_QUESTION_LIMITS.MINIMUM_ANSWERS
						) }
						type={ NOTICE_TYPES.ERROR }
						variant={ NOTICE_VARIANTS.SIDE_PANEL }
					/>
				) }

				<div className="googlesitekit-rrm-custom-question-form__actions">
					<P
						className="googlesitekit-rrm-custom-question-form__count"
						size={ SIZE_MEDIUM }
					>
						{ createInterpolateElement(
							sprintf(
								/* translators: 1: Number of answers with text. 2: Maximum number of answers. */
								_n(
									'<b>%1$d answer added</b> (up to %2$d)',
									'<b>%1$d answers added</b> (up to %2$d)',
									trimmedAnswers.length,
									'google-site-kit'
								),
								trimmedAnswers.length,
								CUSTOM_QUESTION_LIMITS.MAXIMUM_ANSWERS
							),
							{
								b: (
									<Typography
										size={ SIZE_MEDIUM }
										type={ TYPE_LABEL }
									/>
								),
							}
						) }
					</P>

					{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
					<Button onClick={ onClose } type="button" tertiary>
						{ __( 'Cancel', 'google-site-kit' ) }
					</Button>

					{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
					<Button disabled={ isDisabled } type="submit">
						{ __( 'Save', 'google-site-kit' ) }
					</Button>
				</div>
			</footer>
		</form>
	);
};

export default CustomQuestionForm;
