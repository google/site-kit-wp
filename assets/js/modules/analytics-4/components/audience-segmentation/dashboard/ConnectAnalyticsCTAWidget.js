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
import P from '../../../../../components/Typography/P';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../../../constants';
import useActivateModuleCallback from '../../../../../hooks/useActivateModuleCallback';
import {
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';
import LeanCTABanner from '../../../../../components/LeanCTABanner';

export default function ConnectAnalyticsCTAWidget( { Widget } ) {
	const breakpoint = useBreakpoint();

	const isTabletBreakpoint = breakpoint === BREAKPOINT_TABLET;

	const handleConnectModule = useActivateModuleCallback(
		MODULE_SLUG_ANALYTICS_4
	);

	const Icon = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleIcon( MODULE_SLUG_ANALYTICS_4 )
	);

	const content = isTabletBreakpoint ? (
		<P>
			{ createInterpolateElement(
				__(
					'Google Analytics is disconnected, your audience metrics can’t be displayed. <a>Connect Google Analytics</a>',
					'google-site-kit'
				),
				{
					a: <Link onClick={ handleConnectModule } secondary />,
				}
			) }
		</P>
	) : (
		<Fragment>
			<P>
				{ __(
					'Google Analytics is disconnected, your audience metrics can’t be displayed',
					'google-site-kit'
				) }
			</P>
			<Link onClick={ handleConnectModule } secondary>
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
