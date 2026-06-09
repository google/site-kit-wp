/**
 * SplashViewOnlyContent component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import Link from '@/js/components/Link';
import OptIn from '@/js/components/OptIn';
import SplashScreenshotSVG from '@/js/components/setup/SetupUsingProxyWithSignIn/SetupFlowSVG';
import Typography from '@/js/components/Typography';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import { Cell, Row } from '@/js/material-components';
import SplashBackground from '@/svg/graphics/splash-graphic.svg';

export default function SplashViewOnlyContent( {
	documentationURL,
	onButtonClick,
} ) {
	// Add the initial setup class to the body when the component mounts.
	useMount( () => {
		global.document.body.classList.add( 'googlesitekit-setup-flow' );
	} );

	const breakpoint = useBreakpoint();
	const isMobileOrTablet =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;

	return (
		<Row className="googlesitekit-setup__content">
			<Cell smSize={ 4 } mdSize={ 8 } lgSize={ 6 }>
				<Typography
					as="h1"
					className="googlesitekit-setup__title"
					size={ isMobileOrTablet ? 'small' : 'medium' }
					type="headline"
				>
					{ __( 'View-only Dashboard Access', 'google-site-kit' ) }
				</Typography>

				<p className="googlesitekit-setup__description googlesitekit-setup__description--view-only">
					{ createInterpolateElement(
						__(
							"Get insights about how people find and use your site as well as how to improve and monetize your content, directly in your WordPress dashboard. <br /> An administrator has granted you access to view this site's dashboard containing stats from these shared Google services. <a>Learn more</a>",
							'google-site-kit'
						),
						{
							a: (
								<Link
									aria-label={ __(
										'Learn more about dashboard sharing',
										'google-site-kit'
									) }
									href={ documentationURL }
									external
									hideExternalIndicator
								/>
							),
							br: <br />,
						}
					) }
				</p>

				<OptIn />

				<div className="googlesitekit-start-setup-wrap">
					<Button onClick={ onButtonClick }>
						{ __( 'Go to dashboard', 'google-site-kit' ) }
					</Button>
				</div>
			</Cell>

			<Cell
				smSize={ 4 }
				mdSize={ 8 }
				lgSize={ 6 }
				className="googlesitekit-setup__screenshot"
			>
				<SplashBackground
					className="googlesitekit-setup__splash-graphic-background"
					width="508"
					height="466"
				/>
				<div className="googlesitekit-setup__splash-graphic-screenshot">
					<SplashScreenshotSVG />
				</div>
			</Cell>
		</Row>
	);
}

SplashViewOnlyContent.propTypes = {
	documentationURL: PropTypes.string,
	onButtonClick: PropTypes.func.isRequired,
};
