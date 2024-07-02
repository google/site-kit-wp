/**
 * ConnectAnalyticsCTAWidget component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { Fragment, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import AudienceConnectAnalyticsCTAGraphic from '../../../../../../svg/graphics/audience-connect-analytics-cta-graphic.svg';
import AudienceConnectAnalyticsCTAGraphicTablet from '../../../../../../svg/graphics/audience-connect-analytics-cta-graphic-tablet.svg';
import Link from '../../../../../components/Link';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import useActivateModuleCallback from '../../../../../hooks/useActivateModuleCallback';
import {
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';
import LeanCTABanner from '../../../../../components/LeanCTABanner';

export default function ConnectAnalyticsCTAWidget( { Widget } ) {
	const breakpoint = useBreakpoint();

	const isTabletBreakpoint = breakpoint === BREAKPOINT_TABLET;

	const handleConnectModule = useActivateModuleCallback( 'analytics-4' );

	const Icon = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleIcon( 'analytics-4' )
	);

	const content = isTabletBreakpoint ? (
		<p>
			{ createInterpolateElement(
				__(
					'Google Analytics is disconnected, your audience metrics can’t be displayed. <a>Connect Google Analytics</a>',
					'google-site-kit'
				),
				{
					a: <Link secondary onClick={ handleConnectModule } />,
				}
			) }
		</p>
	) : (
		<Fragment>
			<p>
				{ __(
					'Google Analytics is disconnected, your audience metrics can’t be displayed',
					'google-site-kit'
				) }
			</p>
			<Link secondary onClick={ handleConnectModule }>
				{ __( 'Connect Google Analytics', 'google-site-kit' ) }
			</Link>
		</Fragment>
	);

	return (
		<Widget noPadding>
			<LeanCTABanner
				Icon={ Icon }
				SVGGraphic={
					isTabletBreakpoint
						? AudienceConnectAnalyticsCTAGraphicTablet
						: AudienceConnectAnalyticsCTAGraphic
				}
			>
				{ content }
			</LeanCTABanner>
		</Widget>
	);
}

ConnectAnalyticsCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};
