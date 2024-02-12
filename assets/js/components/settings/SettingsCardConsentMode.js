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
import ConsentModeSwitch from '../consent-mode/ConsentModeSwitch';
import ConsentModeRegions from '../consent-mode/ConsentModeRegions';

export default function SettingsCardConsentMode() {
	return (
		<Layout
			title={ __( 'Consent Mode', 'google-site-kit' ) }
			header
			rounded
		>
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<ConsentModeSwitch />
							<ConsentModeRegions />
						</Cell>
					</Row>
				</Grid>
			</div>
		</Layout>
	);
}
