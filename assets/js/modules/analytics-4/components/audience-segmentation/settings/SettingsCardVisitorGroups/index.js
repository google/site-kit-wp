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
import { Switch } from 'googlesitekit-components';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { Cell, Grid, Row } from '../../../../../../material-components';
import useViewContext from '../../../../../../hooks/useViewContext';
import { trackEvent } from '../../../../../../util';
import Layout from '../../../../../../components/layout/Layout';
import SetupCTA from './SetupCTA';
import SetupSuccess from './SetupSuccess';

export default function SettingsCardVisitorGroups() {
	const viewContext = useViewContext();

	const audienceSegmentationWidgetHidden = useSelect( ( select ) =>
		select( CORE_USER ).isAudienceSegmentationWidgetHidden()
	);
	const configuredAudiences = useSelect( ( select ) =>
		select( CORE_USER ).getConfiguredAudiences()
	);
	const audienceSegmentationSetupCompletedBy = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAudienceSegmentationSetupCompletedBy()
	);

	const { setAudienceSegmentationWidgetHidden, saveAudienceSettings } =
		useDispatch( CORE_USER );

	const handleKeyMetricsToggle = useCallback( () => {
		const action = audienceSegmentationWidgetHidden
			? 'audience_widgets_enable'
			: 'audience_widgets_disable';

		trackEvent( `${ viewContext }_audiences-settings`, action ).finally(
			async () => {
				await setAudienceSegmentationWidgetHidden(
					! audienceSegmentationWidgetHidden
				);
				await saveAudienceSettings();
			}
		);
	}, [
		audienceSegmentationWidgetHidden,
		saveAudienceSettings,
		setAudienceSegmentationWidgetHidden,
		viewContext,
	] );

	if (
		configuredAudiences === undefined ||
		audienceSegmentationSetupCompletedBy === undefined
	) {
		return null;
	}

	const showSetupCTA =
		! configuredAudiences && audienceSegmentationSetupCompletedBy === null;

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
							{ showSetupCTA && <SetupCTA /> }
							{ ! showSetupCTA && (
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
