/**
 * Button component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import useMergedRef from '@react-hook/merged-ref';

/**
 * WordPress dependencies
 */
import { forwardRef, useCallback } from '@wordpress/element';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { MDCRipple } from '../../material-components';
import Tooltip from './Tooltip';

type ButtonProps = {
	onClick?: () => void;
	children?: React.ReactNode;
	href?: string;
	text?: boolean;
	className?: string;
	danger?: boolean;
	disabled?: boolean;
	icon?: React.ReactElement;
	trailingIcon?: React.ReactElement;
	title?: string;
	customizedTooltip?: React.ReactElement;
	tooltip?: boolean;
	inverse?: boolean;
	hideTooltipTitle?: boolean;
	'aria-label'?: string;
	target?: string;
	tooltipEnterDelayInMS?: number;
};

// eslint-disable-next-line sitekit/acronym-case
const Button = forwardRef< HTMLButtonElement, ButtonProps >(
	(
		{
			children,
			href,
			text,
			className,
			danger,
			disabled,
			target,
			icon,
			trailingIcon,
			'aria-label': ariaLabel,
			title,
			customizedTooltip,
			tooltip,
			inverse,
			hideTooltipTitle = false,
			tooltipEnterDelayInMS = 100,
			...extraProps
		},
		ref
	) => {
		const buttonRef = useCallback(
			// eslint-disable-next-line sitekit/acronym-case
			( el: HTMLButtonElement | HTMLAnchorElement ) => {
				if ( el !== null ) {
					MDCRipple.attachTo( el );
				}
			},
			[]
		);
		const mergedRefs = useMergedRef( ref, buttonRef );

		// Use a button if disabled, even if a href is provided to ensure expected behavior.
		const SemanticButton = href && ! disabled ? 'a' : 'button';

		const getAriaLabel = () => {
			let label = ariaLabel;

			if ( target !== '_blank' ) {
				return label;
			}

			const newTabText = _x(
				'(opens in a new tab)',
				'screen reader text',
				'google-site-kit'
			);

			if ( typeof children === 'string' ) {
				label = label || children;
			}

			if ( label ) {
				return `${ label } ${ newTabText }`;
			}

			return newTabText;
		};

		const ButtonComponent = (
			<SemanticButton
				className={ classnames( 'mdc-button', className, {
					'mdc-button--raised': ! text,
					'mdc-button--danger': danger,
					'mdc-button--inverse': inverse,
				} ) }
				href={ disabled ? undefined : href }
				ref={ mergedRefs }
				disabled={ !! disabled }
				aria-label={ getAriaLabel() }
				target={ target || '_self' }
				role={ 'a' === SemanticButton ? 'button' : undefined }
				{ ...extraProps }
			>
				{ icon }
				{ children && (
					<span className="mdc-button__label">{ children }</span>
				) }
				{ trailingIcon }
			</SemanticButton>
		);

		const tooltipTitle = ! hideTooltipTitle
			? title || customizedTooltip || ariaLabel
			: null;

		if (
			( tooltip && tooltipTitle ) ||
			( icon && tooltipTitle && children === undefined )
		) {
			return (
				<Tooltip
					title={ tooltipTitle }
					enterDelay={ tooltipEnterDelayInMS }
				>
					{ ButtonComponent }
				</Tooltip>
			);
		}

		return ButtonComponent;
	}
);

Button.displayName = 'Button';

export default Button;
