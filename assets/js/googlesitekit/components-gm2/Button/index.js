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
import PropTypes from 'prop-types';
import useMergedRef from '@react-hook/merged-ref';

/**
 * WordPress dependencies
 */
import { forwardRef, useCallback } from '@wordpress/element';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { MDCRipple } from '../../../material-components';
import SemanticButton from './SemanticButton';
import MaybeTooltip from './MaybeTooltip';

const Button = forwardRef(
	(
		{
			children,
			href = null,
			text = false,
			className = '',
			danger = false,
			disabled = false,
			target,
			icon = null,
			trailingIcon = null,
			'aria-label': ariaLabel,
			title = null,
			customizedTooltip = null,
			tooltip = false,
			inverse = false,
			hideTooltipTitle = false,
			tooltipEnterDelayInMS = 100,
			tertiary = false,
			callout = false,
			calloutStyle = null,
			...extraProps
		},
		ref
	) => {
		const buttonRef = useCallback( ( el ) => {
			if ( el !== null ) {
				MDCRipple.attachTo( el );
			}
		}, [] );
		const mergedRefs = useMergedRef( ref, buttonRef );

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

		const tooltipTitle = ! hideTooltipTitle
			? title || customizedTooltip || ariaLabel
			: null;

		return (
			<MaybeTooltip
				disabled={ disabled }
				tooltip={ tooltip }
				tooltipTitle={ tooltipTitle }
				hasIconOnly={ !! icon && children === undefined }
				tooltipEnterDelayInMS={ tooltipEnterDelayInMS }
			>
				<SemanticButton
					href={ href }
					disabled={ disabled }
					className={ className }
					danger={ danger }
					text={ text }
					tertiary={ tertiary }
					inverse={ inverse }
					callout={ callout }
					calloutStyle={ calloutStyle }
					ref={ mergedRefs }
					aria-label={ getAriaLabel() }
					target={ target || '_self' }
					{ ...extraProps }
				>
					{ icon }
					{ children && (
						<span className="mdc-button__label">{ children }</span>
					) }
					{ trailingIcon }
				</SemanticButton>
			</MaybeTooltip>
		);
	}
);

Button.propTypes = {
	onClick: PropTypes.func,
	children: PropTypes.node,
	href: PropTypes.string,
	text: PropTypes.bool,
	className: PropTypes.string,
	danger: PropTypes.bool,
	disabled: PropTypes.bool,
	icon: PropTypes.element,
	trailingIcon: PropTypes.element,
	title: PropTypes.string,
	customizedTooltip: PropTypes.element,
	tooltip: PropTypes.bool,
	inverse: PropTypes.bool,
	hideTooltipTitle: PropTypes.bool,
	callout: PropTypes.bool,
	calloutStyle: PropTypes.oneOf( [ 'primary', 'warning', 'error' ] ),
};

export default Button;
