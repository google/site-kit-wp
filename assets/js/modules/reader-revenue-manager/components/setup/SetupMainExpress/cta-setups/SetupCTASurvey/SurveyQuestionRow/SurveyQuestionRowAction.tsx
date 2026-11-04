/**
 * SurveyQuestionRowAction component.
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
import { FC, Fragment } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ActionButton, { ActionButtonProps } from '@/js/components/ActionButton';
import CheckColor from '@/svg/icons/check-color.svg';
import MinusCircle from '@/svg/icons/minus-circle.svg';
import PlusCircle from '@/svg/icons/plus-circle.svg';

interface SurveyQuestionRowActionProps
	extends Omit< ActionButtonProps, 'Icon' | 'label' > {
	disabledMessage?: string;
	isAdded: boolean;
	isExpandable: boolean;
	onAdd?: () => void;
	onRemove?: () => void;
}

const SurveyQuestionRowAction: FC< SurveyQuestionRowActionProps > = ( {
	'aria-describedby': ariaDescribedBy = '',
	className,
	isAdded,
	isExpandable,
	onAdd,
	onRemove,
	disabled,
	disabledMessage,
	...props
} ) => {
	const descriptionID = useInstanceId(
		SurveyQuestionRowAction,
		'googlesitekit-rrm-survey-question-row-action'
	) as string;

	const description =
		disabled && disabledMessage ? disabledMessage : undefined;

	const label = isAdded
		? __( 'Remove question', 'google-site-kit' )
		: __( 'Add question', 'google-site-kit' );

	const RemoveIcon = isExpandable ? CheckColor : MinusCircle;

	const classNames = classnames(
		'googlesitekit-rrm-survey-question-row__action',
		className
	);

	return (
		<Fragment>
			<ActionButton
				aria-describedby={ `${ descriptionID } ${ ariaDescribedBy }` }
				className={ classNames }
				disabled={ disabled }
				Icon={ isAdded ? RemoveIcon : PlusCircle }
				iconSize={ 18 }
				label={ label }
				onClick={ isAdded ? onRemove : onAdd }
				tooltip={ description }
				{ ...props }
			/>
			<span id={ descriptionID } hidden>
				{ description }
			</span>
		</Fragment>
	);
};

export default SurveyQuestionRowAction;
