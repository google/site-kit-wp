/**
 * Splash component for SetupUsingProxyWithSignIn.
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
 * WordPress dependencies
 */
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WelcomeSVG from '../../../../svg/graphics/welcome.svg';
import WelcomeAnalyticsSVG from '../../../../svg/graphics/welcome-analytics.svg';
import Link from '../../Link';
import ActivateAnalyticsNotice from '../ActivateAnalyticsNotice';
import CompatibilityChecks from '../CompatibilityChecks';
import { DISCONNECTED_REASON_CONNECTED_URL_MISMATCH } from '../../../googlesitekit/datastore/user/constants';
import { Grid, Row, Cell } from '../../../material-components';

export default function Splash( {
	title,
	description,
	showLearnMoreLink,
	secondAdminLearnMoreLink,
	getHelpURL,
	disconnectedReason,
	connectedProxyURL,
	homeURL,
	analyticsModuleActive,
	analyticsModuleAvailable,
	children,
} ) {
	const cellDetailsProp = analyticsModuleActive
		? { smSize: 4, mdSize: 8, lgSize: 6 }
		: { smSize: 4, mdSize: 8, lgSize: 8 };

	return (
		<section className="googlesitekit-setup__splash">
			<Grid>
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
						<h1 className="googlesitekit-setup__title">
							{ title }
						</h1>

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
												href={
													secondAdminLearnMoreLink
												}
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
								<p>
									{ sprintf(
										/* translators: %s: Previous Connected Proxy URL */
										__(
											'— Old URL: %s',
											'google-site-kit'
										),
										connectedProxyURL
									) }
									<br />
									{ sprintf(
										/* translators: %s: Connected Proxy URL */
										__(
											'— New URL: %s',
											'google-site-kit'
										),
										homeURL
									) }
								</p>
							) }

						{ analyticsModuleAvailable &&
							! analyticsModuleActive && (
								<ActivateAnalyticsNotice />
							) }

						<CompatibilityChecks>
							{ ( {
								complete,
								inProgressFeedback,
								ctaFeedback,
							} ) => (
								<Fragment>
									{ ctaFeedback }
									{ children( {
										complete,
										inProgressFeedback,
									} ) }
								</Fragment>
							) }
						</CompatibilityChecks>
					</Cell>
				</Row>
			</Grid>
		</section>
	);
}
