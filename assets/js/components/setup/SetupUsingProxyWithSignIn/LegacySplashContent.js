/**
 * LegacySplashContent component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ActivateAnalyticsNotice from '@/js/components/setup/ActivateAnalyticsNotice';
import CompatibilityChecks from '@/js/components/setup/CompatibilityChecks';
import Link from '@/js/components/Link';
import P from '@/js/components/Typography/P';
import WelcomeSVG from '@/svg/graphics/welcome.svg';
import WelcomeAnalyticsSVG from '@/svg/graphics/welcome-analytics.svg';
import Typography from '@/js/components/Typography';
import { Cell, Row } from '@/js/material-components';
import { DISCONNECTED_REASON_CONNECTED_URL_MISMATCH } from '@/js/googlesitekit/datastore/user/constants';

export default function LegacySplashContent( {
	analyticsModuleActive,
	analyticsModuleAvailable,
	children,
	connectedProxyURL,
	description,
	disconnectedReason,
	getHelpURL,
	homeURL,
	secondAdminLearnMoreLink,
	showLearnMoreLink,
	title,
} ) {
	const cellDetailsProp = analyticsModuleActive
		? { smSize: 4, mdSize: 8, lgSize: 6 }
		: { smSize: 4, mdSize: 8, lgSize: 8 };

	return (
		<Row className="googlesitekit-setup__content">
			<Cell
				smSize={ 4 }
				mdSize={ 8 }
				lgSize={ ! analyticsModuleActive ? 4 : 6 }
				className="googlesitekit-setup__icon"
			>
				{ analyticsModuleActive && (
					<WelcomeSVG width="570" height="336" />
				) }
				{ ! analyticsModuleActive && (
					<WelcomeAnalyticsSVG height="167" width="175" />
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
				{ getHelpURL && (
					<Link href={ getHelpURL } external>
						{ __( 'Get help', 'google-site-kit' ) }
					</Link>
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

				{ analyticsModuleAvailable && ! analyticsModuleActive && (
					<ActivateAnalyticsNotice />
				) }

				<CompatibilityChecks>{ children }</CompatibilityChecks>
			</Cell>
		</Row>
	);
}

LegacySplashContent.propTypes = {
	analyticsModuleActive: PropTypes.bool,
	analyticsModuleAvailable: PropTypes.bool,
	children: PropTypes.func,
	connectedProxyURL: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.bool,
	] ),
	description: PropTypes.string,
	disconnectedReason: PropTypes.string,
	getHelpURL: PropTypes.string,
	homeURL: PropTypes.string,
	secondAdminLearnMoreLink: PropTypes.string,
	title: PropTypes.string.isRequired,
};
