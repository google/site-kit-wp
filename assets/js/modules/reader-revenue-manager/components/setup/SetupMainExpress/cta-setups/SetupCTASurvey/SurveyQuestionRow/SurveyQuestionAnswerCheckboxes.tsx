/**
 * SurveyQuestionAnswerCheckboxes component.
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
import { ChangeEvent, ComponentPropsWithoutRef, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Checkbox } from 'googlesitekit-components';
import Typography from '@/js/components/Typography';
import { SIZE_SMALL, TYPE_BODY } from '@/js/components/Typography/constants';
import { SurveyQuestionAnswer } from './types';

interface SurveyQuestionAnswerCheckboxesProps
	extends Omit<
		ComponentPropsWithoutRef< 'fieldset' >,
		'children' | 'onChange'
	> {
	answers: SurveyQuestionAnswer[];
	value?: string[];
	onChange: ( value: string[] ) => void;
}

const SurveyQuestionAnswerCheckboxes: FC<
	SurveyQuestionAnswerCheckboxesProps
> = ( { answers, className, onChange, value = [], ...props } ) => {
	const instanceID = useInstanceId(
		SurveyQuestionAnswerCheckboxes,
		'googlesitekit-survey-question-answer-checkboxes'
	);

	const onChangeCheckbox = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			const selectedIDs = answers
				.filter( ( answer ) =>
					answer.id === event.target.value
						? event.target.checked
						: value.includes( answer.id )
				)
				.map( ( answer ) => answer.id );

			onChange( selectedIDs );
		},
		[ answers, onChange, value ]
	);

	const classNames = classnames(
		'googlesitekit-rrm-survey-question-row__answer-checkboxes',
		className
	);

	return (
		<fieldset { ...props } className={ classNames }>
			{ answers.map( ( { id, label } ) => (
				<Checkbox
					checked={ value.includes( id ) }
					id={ `${ instanceID }-${ id }` }
					key={ id }
					name={ `${ instanceID }[]` }
					onChange={ onChangeCheckbox }
					value={ id }
					alignLeft
				>
					<Typography size={ SIZE_SMALL } type={ TYPE_BODY }>
						{ label }
					</Typography>
				</Checkbox>
			) ) }
		</fieldset>
	);
};

export default SurveyQuestionAnswerCheckboxes;
