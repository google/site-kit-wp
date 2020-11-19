/**
 * Button component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import PropTypes from 'prop-types';
import useMergedRef from '@react-hook/merged-ref';

/**
 * WordPress dependencies
 */
import { forwardRef, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { MDCRipple } from '../material-components';

const Button = forwardRef( ( {
	children,
	href,
	text,
	className,
	danger,
	disabled,
	target,
	icon,
	trailingIcon,
	...extraProps
}, ref ) => {
	const buttonRef = useRef( null );
	const mergedRefs = useMergedRef( ref, buttonRef );

	useEffect( () => {
		MDCRipple.attachTo( buttonRef.current );
	} );

	// Use a button if disabled, even if a href is provided to ensure expected behavior.
	const SemanticButton = ( href && ! disabled ) ? 'a' : 'button';

	return (
		<SemanticButton
			className={ classnames(
				'mdc-button',
				className,
				{
					'mdc-button--raised': ! text,
					'mdc-button--danger': danger,
				}
			) }
			href={ disabled ? undefined : href }
			ref={ mergedRefs }
			disabled={ !! disabled }
			target={ target || '_self' }
			role={ 'a' === SemanticButton ? 'button' : undefined }
			{ ...extraProps }
		>
			{ icon }
			<span className="mdc-button__label">{ children }</span>
			{ trailingIcon }
		</SemanticButton>
	);
} );

Button.displayName = 'Button';

Button.propTypes = {
	onClick: PropTypes.func,
	children: PropTypes.string.isRequired,
	href: PropTypes.string,
	text: PropTypes.bool,
	className: PropTypes.string,
	danger: PropTypes.bool,
	disabled: PropTypes.bool,
	icon: PropTypes.element,
	trailingIcon: PropTypes.element,
};

Button.defaultProps = {
	onClick: null,
	href: null,
	text: false,
	className: '',
	danger: false,
	disabled: false,
	icon: null,
	trailingIcon: null,
};

export default Button;
