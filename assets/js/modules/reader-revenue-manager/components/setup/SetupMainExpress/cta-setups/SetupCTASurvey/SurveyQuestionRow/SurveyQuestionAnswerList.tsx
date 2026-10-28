/**
 * SurveyQuestionAnswerList component.
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
import { ComponentPropsWithoutRef, FC } from 'react';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import { SIZE_SMALL, TYPE_BODY } from '@/js/components/Typography/constants';
import { SurveyQuestionAnswer } from './types';

interface SurveyQuestionAnswerListProps
	extends Omit< ComponentPropsWithoutRef< 'ul' >, 'children' > {
	answers: SurveyQuestionAnswer[];
}

const SurveyQuestionAnswerList: FC< SurveyQuestionAnswerListProps > = ( {
	answers,
	className,
	...props
} ) => {
	const classNames = classnames(
		'googlesitekit-rrm-survey-question-row__answer-list',
		className
	);

	return (
		<ul { ...props } className={ classNames }>
			{ answers.map( ( { id, label } ) => (
				<Typography
					as="li"
					key={ id }
					size={ SIZE_SMALL }
					type={ TYPE_BODY }
				>
					{ label }
				</Typography>
			) ) }
		</ul>
	);
};

export default SurveyQuestionAnswerList;
