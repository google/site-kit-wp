/**
 * SurveyQuestionRow component.
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
import classnames from 'classnames';
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_BODY,
	TYPE_LABEL,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import ChevronDown from '@/svg/icons/chevron-down.svg';
import PencilIcon from '@/svg/icons/pencil.svg';
import SurveyQuestionAnswerCheckboxes from './SurveyQuestionAnswerCheckboxes';
import SurveyQuestionAnswerList from './SurveyQuestionAnswerList';
import SurveyQuestionRowAction from './SurveyQuestionRowAction';
import { SurveyQuestionAnswer } from './types';

export interface SurveyQuestionRowProps {
	answers?: SurveyQuestionAnswer[];
	disabled?: boolean;
	disabledMessage?: string;
	isAdded: boolean;
	isExpanded: boolean;
	leadingElement?: ReactNode;
	note?: ReactNode;
	onAdd?: () => void;
	onChange?: ( value: string[] ) => void;
	onEdit?: () => void;
	onExpand?: ( isExpanded: boolean ) => void;
	onRemove?: () => void;
	question: string;
	value?: string[];
}

const SurveyQuestionRow: FC< SurveyQuestionRowProps > = ( {
	answers,
	disabled,
	disabledMessage,
	isAdded = false,
	isExpanded = false,
	leadingElement,
	note,
	onAdd,
	onChange,
	onEdit,
	onExpand,
	onRemove,
	question,
	value,
} ) => {
	const contentID = useInstanceId(
		SurveyQuestionRow,
		'googlesitekit-rrm-survey-question-row-content'
	) as string;

	const noteID = useInstanceId(
		SurveyQuestionRow,
		'googlesitekit-rrm-survey-question-row-note'
	) as string;

	const questionID = useInstanceId(
		SurveyQuestionRow,
		'googlesitekit-rrm-survey-question-row-question'
	) as string;

	const hasAnswers = !! answers?.length;
	const isChangeable = !! onChange;
	const isExpandable = !! onExpand;

	const classNames = classnames( 'googlesitekit-rrm-survey-question-row', {
		'googlesitekit-rrm-survey-question-row--is-expandable': isExpandable,
		'googlesitekit-rrm-survey-question-row--is-expanded':
			isExpanded && isExpandable,
		'googlesitekit-rrm-survey-question-row--is-highlighted':
			isExpanded && ! isExpandable,
	} );

	return (
		<div className={ classNames }>
			<div className="googlesitekit-rrm-survey-question-row__inner">
				<div className="googlesitekit-rrm-survey-question-row__actions">
					{ leadingElement }

					<SurveyQuestionRowAction
						aria-describedby={ questionID }
						disabled={ disabled }
						disabledMessage={ disabledMessage }
						isAdded={ isAdded }
						isExpandable={ isExpandable }
						onAdd={ onAdd }
						onRemove={ onRemove }
					/>
				</div>

				{ isExpandable ? (
					<Typography
						aria-controls={ contentID }
						aria-expanded={ isExpanded }
						as="button"
						asType="button"
						className="googlesitekit-rrm-survey-question-row__expand"
						id={ questionID }
						onClick={ () => onExpand( ! isExpanded ) }
						size={ SIZE_MEDIUM }
						type={ TYPE_BODY }
					>
						{ question }

						<ChevronDown height={ 18 } width={ 18 } />
					</Typography>
				) : (
					<Typography
						className="googlesitekit-rrm-survey-question-row__question"
						id={ questionID }
						size={ SIZE_SMALL }
						type={ TYPE_BODY }
					>
						{ question }
					</Typography>
				) }

				{ isExpandable ? (
					<div
						className="googlesitekit-rrm-survey-question-row__content"
						hidden={ ! isExpanded }
						id={ contentID }
					>
						{ hasAnswers && isChangeable ? (
							<SurveyQuestionAnswerCheckboxes
								aria-labelledby={ note ? noteID : undefined }
								answers={ answers }
								value={ value }
								onChange={ onChange }
							/>
						) : null }

						{ hasAnswers && ! isChangeable ? (
							<SurveyQuestionAnswerList answers={ answers } />
						) : null }

						{ note ? (
							<P
								className="googlesitekit-rrm-survey-question-row__note"
								id={ noteID }
								size={ SIZE_SMALL }
							>
								{ note }
							</P>
						) : null }

						{ onEdit ? (
							<Typography
								aria-describedby={ questionID }
								as={ Link }
								asType="button"
								className="googlesitekit-rrm-survey-question-row__edit"
								onClick={ onEdit }
								size={ SIZE_MEDIUM }
								trailingIcon={
									<PencilIcon height={ 10 } width={ 10 } />
								}
								type={ TYPE_LABEL }
							>
								{ __( 'Edit', 'google-site-kit' ) }
							</Typography>
						) : null }
					</div>
				) : null }
			</div>
		</div>
	);
};

export default SurveyQuestionRow;
