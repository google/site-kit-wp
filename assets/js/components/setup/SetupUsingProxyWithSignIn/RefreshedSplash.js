/**
 * Refreshed Splash component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CompatibilityChecks from '@/js/components/setup/CompatibilityChecks';
import Typography from '@/js/components/Typography';
import P from '@/js/components/Typography/P';
import Checkbox from '@/js/googlesitekit/components-gm2/Checkbox';
import { DISCONNECTED_REASON_CONNECTED_URL_MISMATCH } from '@/js/googlesitekit/datastore/user/constants';
import Link from '@/js/components/Link';
import useActivateAnalyticsOptIn from '@/js/hooks/useActivateAnalyticsOptIn';
import { Cell, Row } from '@/js/material-components';
import SplashGraphic from '@/svg/graphics/splash-graphic.svg';
import SetupFlowSVG from './SetupFlowSVG';
import { useBreakpoint, BREAKPOINT_XLARGE } from '@/js/hooks/useBreakpoint';

export default function RefreshedSplash( {
	analyticsModuleActive,
	analyticsModuleAvailable,
	children,
	connectedProxyURL,
	description,
	disconnectedReason,
	homeURL,
	secondAdminLearnMoreLink,
	showLearnMoreLink,
	title,
} ) {
	const breakpoint = useBreakpoint();
	const { checked, handleOnChange } = useActivateAnalyticsOptIn();

	const cellDetailsProp = analyticsModuleActive
		? { smSize: 4, mdSize: 6, lgSize: 6 }
		: { smSize: 4, mdSize: 7, lgSize: 6 };

	return (
		<Row className="googlesitekit-setup__content">
			<Cell
				smSize={ 4 }
				mdSize={ 8 }
				lgSize={ 6 }
				className="googlesitekit-setup__icon"
			>
				<SplashGraphic width="508" height="466" />
				{ breakpoint !== BREAKPOINT_XLARGE ? (
					<SetupFlowSVG
						name="splash-screenshot"
						width="459"
						height="511"
					/>
				) : (
					<SetupFlowSVG
						name="splash-screenshot-wide-viewport"
						width="642"
						height="916"
					/>
				) }
			</Cell>

			<Cell { ...cellDetailsProp }>
				<Typography
					as="h1"
					className="googlesitekit-setup__title"
					size="large"
					type="headline"
				>
					{ title }
				</Typography>

				<p className="googlesitekit-setup__description">
					{ ! showLearnMoreLink && description }

					{ showLearnMoreLink &&
						createInterpolateElement(
							sprintf(
								/* translators: 1: The description. 2: The learn more link. */
								__(
									'%1$s <Link>%2$s</Link>',
									'google-site-kit'
								),
								description,
								__( 'Learn more', 'google-site-kit' )
							),
							{
								Link: (
									<Link
										href={ secondAdminLearnMoreLink }
										external
									/>
								),
							}
						) }
				</p>

				{ analyticsModuleAvailable && ! analyticsModuleActive && (
					<div className="googlesitekit-setup__analytics-opt-in-wrapper">
						<Checkbox
							id="googlesitekit-analytics-setup-opt-in"
							name="googlesitekit-analytics-setup-opt-in"
							description={ __(
								'To get better insights about your site, Site Kit will update your Analytics account, for example by enabling enhanced measurement. Learn more',
								'google-site-kit'
							) }
							checked={ checked }
							onChange={ handleOnChange }
							value="1"
						>
							{ __(
								'Get visitor insights by connecting Google Analytics as part of setup',
								'google-site-kit'
							) }
						</Checkbox>
					</div>
				) }

				{ DISCONNECTED_REASON_CONNECTED_URL_MISMATCH ===
					disconnectedReason &&
					connectedProxyURL !== homeURL && (
						<P>
							{ sprintf(
								/* translators: %s: Previous Connected Proxy URL */
								__( '— Old URL: %s', 'google-site-kit' ),
								connectedProxyURL
							) }
							<br />
							{ sprintf(
								/* translators: %s: Connected Proxy URL */
								__( '— New URL: %s', 'google-site-kit' ),
								homeURL
							) }
						</P>
					) }

				<CompatibilityChecks>{ children }</CompatibilityChecks>
			</Cell>
		</Row>
	);
}
