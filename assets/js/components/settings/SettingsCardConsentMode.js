/**
 * SettingsCardKeyMetrics component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Layout from '../layout/Layout';
import { Grid, Cell, Row } from '../../material-components';
import Badge from '../../components/Badge';
import ConsentModeSwitch from '../consent-mode/ConsentModeSwitch';
import WPConsentAPIRequirements from '../consent-mode/WPConsentAPIRequirements';
import SettingsNotice, { TYPE_INFO } from '../SettingsNotice';

export default function SettingsCardConsentMode() {
	const isAdsConnected = true;
	const hasWPConsentAPI = false;

	return (
		<Layout
			title={ __( 'Consent Mode', 'google-site-kit' ) }
			badge={
				<Badge
					className="googlesitekit-badge--primary"
					label={ __( 'Recommended', 'google-site-kit' ) }
				/>
			}
			header
			rounded
		>
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-consent-mode">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<ConsentModeSwitch />
						</Cell>
					</Row>
					{ isAdsConnected && (
						<Row>
							<Cell size={ 12 }>
								<SettingsNotice
									type={ TYPE_INFO }
									notice={ __(
										'If you have Google Ads campaigns for this site, it’s highly recommended to enable Consent mode - otherwise you won’t be able to collect any metrics on the effectiveness of your campaigns in regions like the European Economic Area.',
										'google-site-kit'
									) }
								/>
							</Cell>
						</Row>
					) }
					{ ! hasWPConsentAPI && (
						<Row>
							<Cell size={ 12 }>
								<WPConsentAPIRequirements />
							</Cell>
						</Row>
					) }
				</Grid>
			</div>
		</Layout>
	);
}
