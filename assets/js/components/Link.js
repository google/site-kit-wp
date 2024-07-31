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
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ArrowIcon from '../../svg/icons/arrow.svg';
import ArrowInverseIcon from '../../svg/icons/arrow-inverse.svg';
import BackIcon from '../../svg/icons/back.svg';
import ExternalIcon from '../../svg/icons/external.svg';
import IconWrapper from './IconWrapper';

const BUTTON = 'BUTTON';
const BUTTON_DISABLED = 'BUTTON_DISABLED';
const EXTERNAL_LINK = 'EXTERNAL_LINK';
const LINK = 'LINK';
const ROUTER_LINK = 'ROUTER_LINK';

const Link = forwardRef( ( props, ref ) => {
	const {
		'aria-label': ariaLabelProp,
		secondary = false,
		arrow = false,
		back = false,
		caps = false,
		children,
		className = '',
		danger = false,
		disabled = false,
		external = false,
		hideExternalIndicator = false,
		href = '',
		inverse = false,
		noFlex = false,
		onClick,
		small = false,
		standalone = false,
		linkButton = false,
		to,
		leadingIcon,
		trailingIcon,
		...otherProps
	} = props;

	const getType = () => {
		// Force button element if `onClick` prop is passed and there's no `href`
		// or `to` prop.
		if ( ! href && ! to && onClick ) {
			if ( disabled ) {
				return BUTTON_DISABLED;
			}

			return BUTTON;
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

	const type = getType();

	const getLinkComponent = () => {
		if ( type === BUTTON || type === BUTTON_DISABLED ) {
			return 'button';
		}

		if ( type === ROUTER_LINK ) {
			return RouterLink;
		}

		return 'a';
	};

	const getAriaLabel = () => {
		// Otherwise, create an ARIA label if the link opens in a new window
		// or is disabled, to add extra context to the link.
		let labelSuffix;

		if ( type === EXTERNAL_LINK ) {
			labelSuffix = _x(
				'(opens in a new tab)',
				'screen reader text',
				'google-site-kit'
			);
		}

		if ( type === BUTTON_DISABLED ) {
			labelSuffix = _x(
				'(disabled)',
				'screen reader text',
				'google-site-kit'
			);
		}

		if ( ! labelSuffix ) {
			return ariaLabelProp;
		}

		// If an ARIA label was supplied, use that.
		if ( ariaLabelProp ) {
			return `${ ariaLabelProp } ${ labelSuffix }`;
		}

		// Otherwise, use the children prop if it's a string.
		if ( typeof children === 'string' ) {
			return `${ children } ${ labelSuffix }`;
		}

		// If there isn't a string we can use to create the label, we shouldn't
		// make one; otherwise we'll only create an ARIA label that says
		// "(opens in a new tab)", which is not good.
		return undefined;
	};

	const LinkComponent = getLinkComponent();
	const ariaLabel = getAriaLabel();

	// Set the prefix/suffix icons, based on the type of link this is and
	// the props supplied.
	let leadingIconToUse = leadingIcon;
	let trailingIconToUse = trailingIcon;

	if ( back ) {
		leadingIconToUse = <BackIcon width={ 14 } height={ 14 } />;
	}

	if ( external && ! hideExternalIndicator ) {
		trailingIconToUse = <ExternalIcon width={ 14 } height={ 14 } />;
	}

	if ( arrow && ! inverse ) {
		trailingIconToUse = <ArrowIcon width={ 14 } height={ 14 } />;
	}

	if ( arrow && inverse ) {
		trailingIconToUse = <ArrowInverseIcon width={ 14 } height={ 14 } />;
	}

	return (
		<LinkComponent
			aria-label={ ariaLabel }
			className={ classnames( 'googlesitekit-cta-link', className, {
				'googlesitekit-cta-link--secondary': secondary,
				'googlesitekit-cta-link--inverse': inverse,
				'googlesitekit-cta-link--small': small,
				'googlesitekit-cta-link--caps': caps,
				'googlesitekit-cta-link--danger': danger,
				'googlesitekit-cta-link--disabled': disabled,
				'googlesitekit-cta-link--standalone': standalone,
				'googlesitekit-cta-link--link-button': linkButton,
				'googlesitekit-cta-link--no-flex': !! noFlex,
			} ) }
			disabled={ disabled }
			href={
				( type === LINK || type === EXTERNAL_LINK ) && ! disabled
					? href
					: undefined
			}
			onClick={ onClick }
			rel={ type === EXTERNAL_LINK ? 'noopener noreferrer' : undefined }
			ref={ ref }
			target={ type === EXTERNAL_LINK ? '_blank' : undefined }
			to={ to }
			{ ...otherProps }
		>
			{ !! leadingIconToUse && (
				<IconWrapper marginRight={ 5 }>
					{ leadingIconToUse }
				</IconWrapper>
			) }
			<span className="googlesitekit-cta-link__contents">
				{ children }
			</span>
			{ !! trailingIconToUse && (
				<IconWrapper marginLeft={ 5 }>
					{ trailingIconToUse }
				</IconWrapper>
			) }
		</LinkComponent>
	);
} );

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
	inverse: PropTypes.bool,
	leadingIcon: PropTypes.node,
	linkButton: PropTypes.bool,
	noFlex: PropTypes.bool,
	onClick: PropTypes.func,
	small: PropTypes.bool,
	standalone: PropTypes.bool,
	to: PropTypes.string,
	trailingIcon: PropTypes.node,
};

export default Link;
