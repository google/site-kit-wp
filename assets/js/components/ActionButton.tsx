/**
 * ActionButton component.
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
import {
	ButtonHTMLAttributes,
	ComponentType,
	FC,
	RefAttributes,
	SVGAttributes,
} from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import MaybeTooltip from '@/js/googlesitekit/components-gm2/Button/MaybeTooltip';

export interface ActionButtonProps
	extends Omit<
		ButtonHTMLAttributes< HTMLButtonElement >,
		'children' | 'aria-label'
	> {
	Icon: ComponentType< SVGAttributes< SVGElement > >;
	iconSize?: number;
	label: string;
	tooltip?: string;
}

const ActionButton: FC<
	ActionButtonProps & RefAttributes< HTMLButtonElement >
> = forwardRef< HTMLButtonElement, ActionButtonProps >(
	(
		{
			className,
			Icon,
			iconSize = 24,
			label,
			tooltip,
			type = 'button',
			...buttonProps
		},
		ref
	) => (
		// @ts-expect-error `MaybeTooltip` component is not yet typed.
		<MaybeTooltip tooltipTitle={ tooltip } tooltip>
			{ /* Material UI complains if Tooltip wraps a disabled button directly. */ }
			<div className="googlesitekit-action-button">
				<button
					{ ...buttonProps }
					aria-label={ label }
					className={ classnames(
						'googlesitekit-action-button__button',
						className
					) }
					ref={ ref }
					type={ type }
				>
					<Icon
						aria-hidden="true"
						focusable="false"
						height={ iconSize }
						width={ iconSize }
					/>
				</button>
			</div>
		</MaybeTooltip>
	)
);

export default ActionButton;
