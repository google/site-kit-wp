/**
 * SettingsCardVisitorGroups component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Switch } from 'googlesitekit-components';
import { Cell, Grid, Row } from '../../material-components';
import Layout from '../layout/Layout';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
const { useDispatch, useSelect } = Data;

export default function SettingsCardVisitorGroups() {
	const audienceSegmentationWidgetHidden = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isAudienceSegmentationWidgetHidden()
	);

	const { setAudienceSegmentationWidgetHidden, saveAudienceSettings } =
		useDispatch( MODULES_ANALYTICS_4 );

	const handleKeyMetricsToggle = useCallback( async () => {
		await setAudienceSegmentationWidgetHidden(
			! audienceSegmentationWidgetHidden
		);
		await saveAudienceSettings();
	}, [
		audienceSegmentationWidgetHidden,
		saveAudienceSettings,
		setAudienceSegmentationWidgetHidden,
	] );

	return (
		<Layout
			className="googlesitekit-settings-meta"
			title={ __( 'Visitor groups', 'google-site-kit' ) }
			header
			fill
			rounded
		>
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<Switch
								label={ __(
									'Display visitors groups in dashboard',
									'google-site-kit'
								) }
								checked={ ! audienceSegmentationWidgetHidden }
								onClick={ handleKeyMetricsToggle }
								hideLabel={ false }
							/>
						</Cell>
					</Row>
				</Grid>
			</div>
		</Layout>
	);
}
