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
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { Switch } from 'googlesitekit-components';
import { Cell, Grid, Row } from '../../../../../../material-components';
import Layout from '../../../../../../components/layout/Layout';
import SetupCTA from './SetupCTA';
import SetupSuccess from './SetupSuccess';

export default function SettingsCardVisitorGroups() {
	const audienceSegmentationWidgetHidden = useSelect( ( select ) =>
		select( CORE_USER ).isAudienceSegmentationWidgetHidden()
	);
	const configuredAudiences = useSelect( ( select ) =>
		select( CORE_USER ).getConfiguredAudiences()
	);

	const { setAudienceSegmentationWidgetHidden, saveAudienceSettings } =
		useDispatch( CORE_USER );

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

	if ( configuredAudiences === undefined ) {
		return null;
	}

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
							{ ! configuredAudiences?.length && <SetupCTA /> }
							{ !! configuredAudiences?.length && (
								<Fragment>
									<SetupSuccess />
									<Switch
										label={ __(
											'Display visitor groups in dashboard',
											'google-site-kit'
										) }
										checked={
											! audienceSegmentationWidgetHidden
										}
										onClick={ handleKeyMetricsToggle }
										hideLabel={ false }
									/>
								</Fragment>
							) }
						</Cell>
					</Row>
				</Grid>
			</div>
		</Layout>
	);
}
