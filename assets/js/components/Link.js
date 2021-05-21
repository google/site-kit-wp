/**
 * Link component.
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
import classnames from 'classnames';
import { Link as RouterLink } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

const ARIA_TEXT_DISABLED = _x( '(disabled)', 'screen reader text', 'google-site-kit' );
const ARIA_TEXT_EXTERNAL = _x( '(opens in a new tab)', 'screen reader text', 'google-site-kit' );

const BUTTON = 'BUTTON';
const BUTTON_DISABLED = 'BUTTON_DISABLED';
const EXTERNAL_LINK = 'EXTERNAL_LINK';
const LINK = 'LINK';
const ROUTER_LINK = 'ROUTER_LINK';
function Link( {
	'aria-label': ariaLabelProp,
	arrow,
	back,
	caps,
	children,
	className,
	danger,
	disabled,
	external,
	hideExternalIndicator,
	href,
	inherit,
	inverse,
	onClick,
	small,
	to,
	...otherProps
} ) {
	const hasStringAsChild = typeof children === 'string';

	// Append `aria-label` with text if label exists, otherwise return text.
	const getLabelWithText = ( text ) => {
		const shouldUseChildrenAsLabel = hasStringAsChild && ! ariaLabelProp;
		const ariaLabel = shouldUseChildrenAsLabel ? children : ariaLabelProp;

		return ariaLabel
			? `${ ariaLabel } ${ text }`
			: text;
	};

	// Do not create `aria-label` value if it would be identical to `children`,
	// redundant label (bad a11y).
	const getNonIdenticalLabel = () => {
		const childIsIdenticalValue = hasStringAsChild && children === ariaLabelProp;

		return childIsIdenticalValue ? undefined : ariaLabelProp;
	};

	const getType = () => {
		// Force button element if `onClick` prop is passed.
		if ( onClick ) {
			return BUTTON;
		}

		// Disabled attribute does not alter behavior of anchors or links.
		if ( disabled ) {
			return BUTTON_DISABLED;
		}

		// Only `RouterLink` uses the `to` prop.
		if ( to ) {
			return ROUTER_LINK;
		}

		// The external prop means this is an external link, which will also output
		// an `<a>` tag.
		if ( external ) {
			return EXTERNAL_LINK;
		}

		// A regular `<a>` tag without external indicators.
		return LINK;
	};

	const getLinkComponent = ( type ) => {
		if ( type === BUTTON || type === BUTTON_DISABLED ) {
			return 'button';
		}

		if ( type === ROUTER_LINK ) {
			return RouterLink;
		}

		return 'a';
	};

	const getAriaLabel = ( type ) => {
		if ( type === EXTERNAL_LINK ) {
			return getLabelWithText( ARIA_TEXT_EXTERNAL );
		}

		if ( type === BUTTON_DISABLED ) {
			return getLabelWithText( ARIA_TEXT_DISABLED );
		}

		return getNonIdenticalLabel();
	};

	const type = getType();
	const LinkComponent = getLinkComponent( type );
	const ariaLabel = getAriaLabel( type );

	return (
		<LinkComponent
			aria-label={ ariaLabel }
			className={ classnames(
				'googlesitekit-cta-link',
				className,
				{
					'googlesitekit-cta-link--arrow': arrow,
					'googlesitekit-cta-link--external': external && ! hideExternalIndicator,
					'googlesitekit-cta-link--inverse': inverse,
					'googlesitekit-cta-link--back': back,
					'googlesitekit-cta-link--small': small,
					'googlesitekit-cta-link--inherit': inherit,
					'googlesitekit-cta-link--caps': caps,
					'googlesitekit-cta-link--danger': danger,
					'googlesitekit-cta-link--disabled': disabled,
				},
			) }
			disabled={ disabled }
			href={ type === LINK || type === EXTERNAL_LINK ? href : undefined }
			onClick={ onClick }
			rel={ type === EXTERNAL_LINK ? 'noopener noreferrer' : undefined }
			target={ type === EXTERNAL_LINK ? '_blank' : undefined }
			to={ to }
			{ ...otherProps }
		>
			{ children }
		</LinkComponent>
	);
}

Link.propTypes = {
	arrow: PropTypes.bool,
	back: PropTypes.bool,
	caps: PropTypes.bool,
	children: PropTypes.node,
	className: PropTypes.string,
	danger: PropTypes.bool,
	disabled: PropTypes.bool,
	external: PropTypes.bool,
	hideExternalIndicator: PropTypes.bool,
	href: PropTypes.string,
	inherit: PropTypes.bool,
	inverse: PropTypes.bool,
	onClick: PropTypes.func,
	small: PropTypes.bool,
	to: PropTypes.string,
};

Link.defaultProps = {
	arrow: false,
	back: false,
	caps: false,
	className: '',
	danger: false,
	disabled: false,
	external: false,
	hideExternalIndicator: false,
	href: '',
	inherit: false,
	inverse: false,
	small: false,
};

export default Link;
