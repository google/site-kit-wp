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

function Link( {
	href: hrefProp,
	children,
	className,
	arrow,
	external,
	hideExternalIndicator,
	inverse,
	back,
	small,
	inherit,
	caps,
	danger,
	disabled,
	to,
	'aria-label': ariaLabelProp,
	...extraProps
} ) {
	const hasStringAsChild = typeof children === 'string';

	// Append `aria-label` with text if label exists, otherwise return text.
	const getLabelWithText = ( text ) => {
		const shouldUseChildrenAsLabel = hasStringAsChild && ! ariaLabelProp;
		const ariaLabel = shouldUseChildrenAsLabel ? children : ariaLabelProp;

		return Boolean( ariaLabel )
			? `${ ariaLabel } ${ text }`
			: text;
	};

	// Do not create `aria-label` value if it would be identical to `children`, redundant label (bad a11y).
	const getNonIdenticalLabel = () => {
		const childIsIdenticalValue = hasStringAsChild && children !== ariaLabelProp;

		return childIsIdenticalValue ? undefined : ariaLabelProp;
	};

	const getElementType = () => {
		// Disabled attribute does not alter behavior of anchors or links.
		if ( disabled ) {
			return 'BUTTON_DISABLED';
		}

		// Only `RouterLink` uses `to` prop.
		if ( typeof to !== 'undefined' ) {
			return 'ROUTER_LINK';
		}

		if ( external ) {
			return 'ANCHOR_EXTERNAL';
		}

		return 'ANCHOR';
	};

	const getSemanticLink = ( elementType ) => {
		switch ( elementType ) {
			case 'BUTTON_DISABLED': return 'button';
			case 'ROUTER_LINK': return RouterLink;
			default: return 'a';
		}
	};

	const getAriaLabel = ( elementType ) => {
		switch ( elementType ) {
			case 'ANCHOR_EXTERNAL': return getLabelWithText( ARIA_TEXT_EXTERNAL );
			case 'BUTTON_DISABLED': return getLabelWithText( ARIA_TEXT_DISABLED );
			default: return getNonIdenticalLabel();
		}
	};

	const type = getElementType();
	const SemanticLink = getSemanticLink( type );
	const ariaLabel = getAriaLabel( type );

	const isAnchor = type === 'ANCHOR' || type === 'ANCHOR_EXTERNAL';
	const href = isAnchor ? hrefProp : undefined;
	const rel = type === 'ANCHOR_EXTERNAL' ? 'noopener noreferrer' : undefined;
	const target = type === 'ANCHOR_EXTERNAL' ? '_blank' : undefined;

	return (
		<SemanticLink
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
			href={ href }
			to={ to }
			target={ target }
			rel={ rel }
			disabled={ disabled }
			aria-label={ ariaLabel }
			{ ...extraProps }
		>
			{ children }
		</SemanticLink>
	);
}

Link.propTypes = {
	dangerouslySetInnerHTML: PropTypes.shape( {
		__html: PropTypes.string,
	} ),
	onClick: PropTypes.func,
	href: PropTypes.string,
	children: PropTypes.oneOfType( [
		PropTypes.string.isRequired,
		PropTypes.array.isRequired,
		PropTypes.element.isRequired,
	] ),
	className: PropTypes.string,
	arrow: PropTypes.bool,
	external: PropTypes.bool,
	hideExternalIndicator: PropTypes.bool,
	inverse: PropTypes.bool,
	back: PropTypes.bool,
	small: PropTypes.bool,
	inherit: PropTypes.bool,
	caps: PropTypes.bool,
	danger: PropTypes.bool,
	disabled: PropTypes.bool,
	to: PropTypes.string,
};

Link.defaultProps = {
	dangerouslySetInnerHTML: undefined,
	onClick: null,
	href: '',
	className: '',
	arrow: false,
	external: false,
	hideExternalIndicator: false,
	inverse: false,
	back: false,
	small: false,
	inherit: false,
	caps: false,
	danger: false,
	disabled: false,
};

export default Link;
