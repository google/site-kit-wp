/**
 * SemanticButton component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

const SemanticButton = forwardRef(
	(
		{
			children,
			href,
			text,
			className,
			danger,
			disabled,
			target,
			'aria-label': ariaLabel,
			inverse,
			tertiary,
			callout,
			calloutStyle,
			...extraProps
		},
		ref
	) => {
		// Use a button if disabled, even if a href is provided to ensure expected behavior.
		const ButtonTag = href && ! disabled ? 'a' : 'button';

		return (
			<ButtonTag
				className={ classnames( 'mdc-button', className, {
					'mdc-button--raised': ! text && ! tertiary && ! callout,
					'mdc-button--danger': danger,
					'mdc-button--inverse': inverse,
					'mdc-button--tertiary': tertiary,
					'mdc-button--callout': callout,
					'mdc-button--callout-primary':
						callout || calloutStyle === 'primary',
					'mdc-button--callout-warning': calloutStyle === 'warning',
					'mdc-button--callout-error': calloutStyle === 'error',
				} ) }
				href={ disabled ? undefined : href }
				ref={ ref }
				disabled={ !! disabled }
				aria-label={ ariaLabel }
				target={ target || '_self' }
				role={ 'a' === ButtonTag ? 'button' : undefined }
				{ ...extraProps }
			>
				{ children }
			</ButtonTag>
		);
	}
);

SemanticButton.displayName = 'SemanticButton';

export default SemanticButton;
