/**
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
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { Fragment } from '@wordpress/element';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../hooks/useBreakpoint';
import Title from './Title';
import Description from './Description';
import HelpText from './HelpText';
import LearnMoreLink from './LearnMoreLink';
import CTAButton from './CTAButton';
import DismissButton from './DismissButton';
import Footer from './Footer';

export default function Banner( {
	className,
	title,
	description,
	helpText,
	learnMoreLink,
	dismissButton,
	ctaButton,
	svg, // NOTE: SVGs must be imported with the ?url suffix for use as a backgroundImage in this component.
	footer,
} ) {
	const breakpoint = useBreakpoint();
	const isMobileOrTablet =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;

	const SVGData = isMobileOrTablet && svg?.mobile ? svg.mobile : svg?.desktop;

	const svgMode = svg?.verticalPosition ? svg.verticalPosition : 'center';

	return (
		<div className={ classnames( 'googlesitekit-banner', className ) }>
			<div className="googlesitekit-banner__content">
				<Title>{ title }</Title>

				<Description>
					<Fragment>
						{ description }

						{ learnMoreLink?.href && (
							<Fragment>
								{ ' ' }
								<LearnMoreLink { ...learnMoreLink } />
							</Fragment>
						) }
					</Fragment>
				</Description>

				{ helpText && <HelpText>{ helpText }</HelpText> }

				<div className="googlesitekit-notice__action">
					{ ctaButton?.label &&
						( ctaButton?.onClick || ctaButton?.href ) && (
							<CTAButton { ...ctaButton } />
						) }
					{ dismissButton?.onClick && (
						<DismissButton { ...dismissButton } />
					) }
				</div>
			</div>

			<div
				className={ classnames(
					'googlesitekit-banner__svg-wrapper',
					svgMode && `googlesitekit-banner__svg-wrapper--${ svgMode }`
				) }
				style={ { backgroundImage: `url(${ SVGData })` } }
			/>

			{ footer && <Footer>{ footer }</Footer> }
		</div>
	);
}

Banner.propTypes = {
	className: PropTypes.string,
	title: PropTypes.string,
	description: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ),
	helpText: PropTypes.string,
	learnMoreLink: PropTypes.shape( LearnMoreLink.propTypes ),
	dismissButton: PropTypes.shape( DismissButton.propTypes ),
	ctaButton: PropTypes.shape( CTAButton.propTypes ),
	svg: PropTypes.shape( {
		desktop: PropTypes.elementType,
		mobile: PropTypes.elementType,
		verticalPosition: PropTypes.oneOf( [ 'top', 'center', 'bottom' ] ),
	} ),
	children: PropTypes.node,
};
