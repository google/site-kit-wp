/**
 * OverlayCard Body component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BREAKPOINT_SMALL, useBreakpoint } from '../../hooks/useBreakpoint';
import Title from './Title';
import Description from './Description';
import DismissButton, { buttonProps } from './DismissButton';
import CTAButton from './CTAButton';

export default function Body( {
	title,
	description,
	ctaButton,
	dismissButton,
	GraphicDesktop,
	GraphicMobile,
} ) {
	const breakpoint = useBreakpoint();

	return (
		<Fragment>
			{ breakpoint !== BREAKPOINT_SMALL && GraphicDesktop && (
				<div className="googlesitekit-overlay-card__graphic">
					<GraphicDesktop />
				</div>
			) }

			<div className="googlesitekit-overlay-card__body">
				{ title && <Title>{ title }</Title> }
				{ description && <Description>{ description }</Description> }
			</div>

			{ ( ctaButton || dismissButton ) && (
				<div className="googlesitekit-overlay-card__actions">
					{ dismissButton && <DismissButton { ...dismissButton } /> }
					{ ctaButton && <CTAButton { ...ctaButton } /> }
				</div>
			) }

			{ breakpoint === BREAKPOINT_SMALL && GraphicMobile && (
				<GraphicMobile />
			) }
		</Fragment>
	);
}

Body.propTypes = {
	title: PropTypes.node,
	description: PropTypes.node,
	ctaButton: PropTypes.shape( {
		...buttonProps,
		href: PropTypes.string,
		target: PropTypes.string,
		trailingIcon: PropTypes.element,
	} ),
	dismissButton: PropTypes.shape( {
		...buttonProps,
	} ),
	GraphicDesktop: PropTypes.elementType,
	GraphicMobile: PropTypes.elementType,
};
