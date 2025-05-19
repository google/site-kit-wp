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
import { useEffect, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { WEEK_IN_SECONDS, trackEvent } from '../../util';
import ConversionReportingSettingsSubtleNotification from '../KeyMetrics/ConversionReportingSettingsSubtleNotification';
import SettingsKeyMetrics from './SettingsKeyMetrics';
import UserInputPreview from '../user-input/UserInputPreview';
import Layout from '../layout/Layout';
import { Grid, Cell, Row } from '../../material-components';
import SurveyViewTrigger from '../surveys/SurveyViewTrigger';
import PreviewBlock from '../PreviewBlock';
import { useInView } from '../../hooks/useInView';
import useViewContext from '../../hooks/useViewContext';

export default function SettingsCardKeyMetrics() {
	const viewContext = useViewContext();
	const inView = useInView();
	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);
	const isGetUserInputSettingsLoading = useSelect( ( select ) => {
		// Ensure that `getUserInputSettings()` is called here in order to trigger its resolver, which we
		// want to track for the loading state. Invoking the selector here rather than relying on one of
		// the child components to call it avoids a brief flicker of the loaded state.
		select( CORE_USER ).getUserInputSettings();

		return select( CORE_USER ).isResolving( 'getUserInputSettings', [] );
	} );

	const isUserInputCompletedLoading = useSelect(
		( select ) =>
			! select( CORE_USER ).hasFinishedResolution(
				'isUserInputCompleted'
			)
	);

	const gaEventCategory = `${ viewContext }_kmw`;

	useEffect( () => {
		if ( isUserInputCompleted ) {
			trackEvent( gaEventCategory, 'summary_view' );
		}
	}, [ isUserInputCompleted, gaEventCategory ] );

	return (
		<Layout title={ __( 'Key Metrics', 'google-site-kit' ) } header rounded>
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-user-input">
				{ isUserInputCompletedLoading && (
					<PreviewBlock
						width="100%"
						smallHeight="100px"
						tabletHeight="100px"
						desktopHeight="117px"
					/>
				) }
				{ isUserInputCompleted && (
					<Fragment>
						<SettingsKeyMetrics
							loading={ isGetUserInputSettingsLoading }
						/>

						<Grid>
							<Row>
								<Cell size={ 12 }>
									<UserInputPreview
										settingsView
										loading={
											isGetUserInputSettingsLoading
										}
									/>
								</Cell>
							</Row>
						</Grid>
					</Fragment>
				) }

				{ isUserInputCompleted === false && (
					<Fragment>
						<SettingsKeyMetrics />
						<Fragment>
							<ConversionReportingSettingsSubtleNotification />
							{ inView && (
								<SurveyViewTrigger
									triggerID="view_kmw_setup_cta"
									ttl={ WEEK_IN_SECONDS }
								/>
							) }
						</Fragment>
					</Fragment>
				) }
			</div>
		</Layout>
	);
}
