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
import { Fragment, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Switch } from 'googlesitekit-components';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Cell, Grid, Row } from '@/js/material-components';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import Layout from '@/js/components/layout/Layout';
import SetupCTA from './SetupCTA';
import SetupSuccess, {
	SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION,
} from './SetupSuccess';
import useQueryArg from '@/js/hooks/useQueryArg';
import { getNavigationalScrollTop } from '@/js/util/scroll';
import { useBreakpoint } from '@/js/hooks/useBreakpoint';

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

	const showSetupSuccess = useSelect( ( select ) =>
		select( CORE_UI ).getValue(
			SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION
		)
	);

	const { setAudienceSegmentationWidgetHidden, saveUserAudienceSettings } =
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
				await saveUserAudienceSettings();
			}
		);
	}, [
		audienceSegmentationWidgetHidden,
		saveUserAudienceSettings,
		setAudienceSegmentationWidgetHidden,
		viewContext,
	] );

	const [ scrollTo ] = useQueryArg( 'scrollTo' );

	const breakpoint = useBreakpoint();

	useEffect( () => {
		if ( scrollTo !== 'visitor-groups' ) {
			return;
		}

		setTimeout( () => {
			global.scrollTo( {
				top:
					getNavigationalScrollTop( '#visitor-groups', breakpoint ) -
					20,
				behavior: 'smooth',
			} );
		}, 50 );
	}, [ scrollTo, breakpoint ] );

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
			id="visitor-groups"
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
									{ showSetupSuccess && <SetupSuccess /> }
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
