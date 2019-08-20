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
import { MDCRipple } from 'SiteKitCore/material-components';
import PropTypes from 'prop-types';

const { Component, createRef } = wp.element;

class Button extends Component {
	constructor( props ) {
		super( props );
		this.buttonRef = createRef();
	}

	componentDidMount() {
		new MDCRipple( this.buttonRef.current );
	}

	render() {
		const {
			onClick,
			children,
			href,
			text,
			className,
			danger,
			disabled,
			target,
			id,
			icon,
			trailingIcon,
			ariaHaspopup,
			ariaExpanded,
			ariaControls,
		} = this.props;

		const SemanticButton = href ? 'a' : 'button';

		return (
			<SemanticButton
				className={ `
					mdc-button
					${ ! text && 'mdc-button--raised' }
					${ className && className }
					${ danger ? 'mdc-button--danger' : '' }
				` }
				onClick={ onClick }
				href={ href }
				ref={ this.buttonRef }
				disabled={ disabled ? 'disabled' : '' }
				target={ target || '_self' }
				id={ id }
				aria-haspopup={ ariaHaspopup }
				aria-expanded={ ariaExpanded }
				aria-controls={ ariaControls }
			>
				{ icon && icon }
				<span className="mdc-button__label">{ children }</span>
				{ trailingIcon && trailingIcon }
			</SemanticButton>
		);
	}
}

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
	ariaHaspopup: PropTypes.string,
	ariaExpanded: PropTypes.bool,
	ariaControls: PropTypes.string,
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
	ariaHaspopup: '',
	ariaExpanded: false,
	ariaControls: '',
};

export default Button;
