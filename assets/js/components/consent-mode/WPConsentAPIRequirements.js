/**
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
 * WordPress dependencies
 */
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { Grid, Cell, Row } from '../../material-components';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import Link from '../Link';
import SettingsNotice, { TYPE_SUGGESTION } from '../SettingsNotice';

const { useSelect } = Data;

// TODO: Extract this to a separate file.
function WPConsentAPIRequirement( { title, children } ) {
	return (
		<div className="googlesitekit-settings-consent-mode-requirement">
			<h4>{ title }</h4>
			{ children }
		</div>
	);
}

export default function WPConsentAPIRequirements() {
	// TODO: Ensure these are the correct documentation links.
	const learnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'wp-consent-api' )
	);
	const suggestedPluginsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'consent-mode-suggested-plugins'
		)
	);

	const installURL = 'http://#';

	return (
		<Fragment>
			<p className="googlesitekit-settings-consent-mode-requirements__description">
				{ __(
					'In order for consent mode to work properly, these requirements must be met:',
					'google-site-kit'
				) }
			</p>
			<Grid className="googlesitekit-settings-consent-mode-requirements__grid">
				<Row>
					<Cell size={ 6 }>
						<WPConsentAPIRequirement
							title={ __(
								'Install WP Consent API',
								'google-site-kit'
							) }
						>
							<p>
								{ createInterpolateElement(
									__(
										'WP Consent API is a plugin that standardizes the communication of accepted consent categories between plugins. <a>Learn more</a>',
										'google-site-kit'
									),
									{
										a: (
											<Link
												href={ learnMoreURL }
												external
												aria-label={ __(
													'Learn more about consent mode',
													'google-site-kit'
												) }
											/>
										),
									}
								) }
							</p>
							<Button href={ installURL }>
								{ __( 'Install', 'google-site-kit' ) }
							</Button>
						</WPConsentAPIRequirement>
					</Cell>
					<Cell size={ 6 }>
						<WPConsentAPIRequirement
							title={ __(
								'Install consent management plugin',
								'google-site-kit'
							) }
						>
							<p>
								{ createInterpolateElement(
									__(
										'You’ll need a plugin compatible with the WP Consent API to display a notice to site visitors and get their consent for tracking. WordPress offers a variety of consent plugins you can choose from. <a>See suggested plugins</a>',
										'google-site-kit'
									),
									{
										a: (
											<Link
												href={ suggestedPluginsURL }
												external
												aria-label={ __(
													'Suggested consent management plugins',
													'google-site-kit'
												) }
											/>
										),
									}
								) }
							</p>
							<SettingsNotice
								type={ TYPE_SUGGESTION }
								notice={ __(
									"Make sure you have installed a plugin compatible with WP Consent API (Site Kit isn't able to verify the compatibility of all WP plugins).",
									'google-site-kit'
								) }
							/>
						</WPConsentAPIRequirement>
					</Cell>
				</Row>
			</Grid>
		</Fragment>
	);
}
