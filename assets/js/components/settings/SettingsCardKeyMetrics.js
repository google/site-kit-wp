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
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { WEEK_IN_SECONDS, trackEvent } from '@/js/util';
import ConversionReportingSettingsSubtleNotification from '@/js/components/KeyMetrics/ConversionReportingSettingsSubtleNotification';
import SettingsKeyMetrics from './SettingsKeyMetrics';
import UserInputPreview from '@/js/components/user-input/UserInputPreview';
import Layout from '@/js/components/layout/Layout';
import { Grid, Cell, Row } from '@/js/material-components';
import SurveyViewTrigger from '@/js/components/surveys/SurveyViewTrigger';
import PreviewBlock from '@/js/components/PreviewBlock';
import { useInView } from '@/js/hooks/useInView';
import { useFeature } from '@/js/hooks/useFeature';
import useViewContext from '@/js/hooks/useViewContext';

export default function SettingsCardKeyMetrics() {
	const viewContext = useViewContext();
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );
	const inView = useInView();
	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);
	const purposeAnswers = useSelect(
		( select ) =>
			select( CORE_USER ).getUserInputSettings()?.purpose?.values || []
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
	const isPurposeAnswered = purposeAnswers.length > 0;

	const shouldShowSummary = setupFlowRefreshEnabled
		? isPurposeAnswered
		: isUserInputCompleted;

	const shouldShowSetupCTA = setupFlowRefreshEnabled
		? ! isPurposeAnswered && ! isGetUserInputSettingsLoading
		: isUserInputCompleted === false;

	const shouldShowLoading = setupFlowRefreshEnabled
		? isGetUserInputSettingsLoading
		: isUserInputCompletedLoading;

	useEffect( () => {
		if ( shouldShowSummary ) {
			trackEvent( gaEventCategory, 'summary_view' );
		}
	}, [ shouldShowSummary, gaEventCategory ] );

	return (
		<Layout
			title={
				setupFlowRefreshEnabled
					? __( 'Personalized metrics', 'google-site-kit' )
					: __( 'Key Metrics', 'google-site-kit' )
			}
			header
			rounded
		>
			<div
				className={ classnames(
					'googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-user-input',
					{
						'googlesitekit-settings-user-input--setupFlowRefresh':
							setupFlowRefreshEnabled,
					}
				) }
			>
				{ shouldShowLoading && (
					<PreviewBlock
						width="100%"
						smallHeight="100px"
						tabletHeight="100px"
						desktopHeight="117px"
					/>
				) }
				{ shouldShowSummary && (
					<Fragment>
						{ ! setupFlowRefreshEnabled && (
							<SettingsKeyMetrics
								loading={ isGetUserInputSettingsLoading }
							/>
						) }

						<Grid>
							<Row>
								<Cell size={ 12 }>
									<UserInputPreview
										loading={
											isGetUserInputSettingsLoading
										}
										settingsView
									/>
								</Cell>
							</Row>
						</Grid>
					</Fragment>
				) }

				{ shouldShowSetupCTA && (
					<Fragment>
						{ ! setupFlowRefreshEnabled && <SettingsKeyMetrics /> }
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
