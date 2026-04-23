/**
 * Key Metrics Setup App.
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
 * External dependencies
 */
import { omit } from 'lodash';
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	useCallback,
	Fragment,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { SpinnerButton } from 'googlesitekit-components';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { Grid, Row, Cell } from '@/js/material-components';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import ExitSetup from '@/js/components/setup/ExitSetup';
import Header from '@/js/components/Header';
import HelpMenu from '@/js/components/help/HelpMenu';
import Layout from '@/js/components/layout/Layout';
import Typography from '@/js/components/Typography';
import P from '@/js/components/Typography/P';
import ProgressIndicator from '@/js/components/ProgressIndicator';
import UserInputSelectOptions from '@/js/components/user-input/UserInputSelectOptions';
import ToastNotice from '@/js/components/ToastNotice';
import { hasErrorForAnswer } from '@/js/components/user-input/util/validation';
import {
	getUserInputAnswers,
	getUserInputAnswersDescription,
	USER_INPUT_MAX_ANSWERS,
	USER_INPUT_QUESTIONS_PURPOSE,
} from '@/js/components/user-input/util/constants';
import useQueryArg from '@/js/hooks/useQueryArg';
import useForwardableParams from '@/js/hooks/useForwardableParams';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';

export default function KeyMetricsSetupApp() {
	const viewContext = useViewContext();
	const forwardableParams = useForwardableParams();

	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const settings = useSelect( ( select ) =>
		select( CORE_USER ).getUserInputSettings()
	);

	const isSavingUserInput = useSelect( ( select ) => {
		return select( CORE_USER ).isSavingUserInputSettings( settings );
	} );

	const isSavingInitialSetup = useSelect(
		( select ) =>
			select( CORE_USER ).isFetchingSaveInitialSetupSettings( {
				isAnalyticsSetupComplete: true,
			} ) || select( CORE_LOCATION ).isNavigating()
	);

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 )
	);

	const settingsLoaded = useSelect(
		( select ) => select( MODULES_ANALYTICS_4 ).getSettings() !== undefined
	);

	const saveUserInputError = useSelect( ( select ) =>
		select( CORE_USER ).getErrorForAction( 'saveUserInputSettings', [] )
	);

	const saveInitialSetupError = useSelect( ( select ) =>
		select( CORE_USER ).getErrorForAction( 'saveInitialSetupSettings', [
			{
				isAnalyticsSetupComplete: true,
			},
		] )
	);

	const values = useSelect(
		( select ) =>
			select( CORE_USER ).getUserInputSetting(
				USER_INPUT_QUESTIONS_PURPOSE
			) || []
	);

	const { saveUserInputSettings, saveInitialSetupSettings, clearError } =
		useDispatch( CORE_USER );

	// Trigger resolution of data availability state before the user proceeds to the dashboard.
	useSelect( ( select ) => {
		select( MODULES_ANALYTICS_4 ).isGatheringData();
		select( MODULES_SEARCH_CONSOLE ).isGatheringData();
	} );

	const isSyncing = useSelect( ( select ) => {
		const isFetchingSyncAvailableCustomDimensions =
			select(
				MODULES_ANALYTICS_4
			).isFetchingSyncAvailableCustomDimensions();

		const isSyncingAudiences =
			select( MODULES_ANALYTICS_4 ).isSyncingAudiences();

		const hasResolvedAnalytics4DataAvailability =
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'isGatheringData'
			);

		const hasResolvedSearchConsoleDataAvailability = select(
			MODULES_SEARCH_CONSOLE
		).hasFinishedResolution( 'isGatheringData' );

		return (
			isFetchingSyncAvailableCustomDimensions ||
			isSyncingAudiences ||
			! hasResolvedAnalytics4DataAvailability ||
			! hasResolvedSearchConsoleDataAvailability
		);
	} );

	const { navigateTo } = useDispatch( CORE_LOCATION );

	// Query arg derived state (declared before callbacks that depend on it).
	const [ showProgress ] = useQueryArg( 'showProgress' );

	const isInitialSetupFlow = !! showProgress;

	useMount( () => {
		if ( isInitialSetupFlow ) {
			trackEvent(
				`${ viewContext }_setup`,
				'setup_flow_v3_view_key_metrics_step'
			);
		} else {
			trackEvent( viewContext, 'view_key_metrics_step' );
		}
	} );

	const saveInitialSetup = useCallback( async () => {
		const response = await saveInitialSetupSettings( {
			isAnalyticsSetupComplete: true,
		} );

		if ( response.error ) {
			return;
		}

		const url = new URL( dashboardURL );

		url.searchParams.set(
			'notification',
			isInitialSetupFlow
				? 'initial_setup_success'
				: 'authentication_success'
		);

		if ( ! isInitialSetupFlow ) {
			url.searchParams.set( 'slug', 'analytics-4' );
		}

		navigateTo( addQueryArgs( url.toString(), forwardableParams ) );
	}, [
		dashboardURL,
		saveInitialSetupSettings,
		navigateTo,
		forwardableParams,
		isInitialSetupFlow,
	] );

	const submitChanges = useCallback( async () => {
		clearError( 'saveInitialSetupSettings', [
			{
				isAnalyticsSetupComplete: true,
			},
		] );

		const response = await saveUserInputSettings();

		if ( ! response.error ) {
			await saveInitialSetup();
		}
	}, [ saveUserInputSettings, saveInitialSetup, clearError ] );

	const { fetchSyncAvailableCustomDimensions, syncAvailableAudiences } =
		useDispatch( MODULES_ANALYTICS_4 );

	useEffect( () => {
		if ( ! settingsLoaded ) {
			return;
		}

		syncAvailableAudiences();
		fetchSyncAvailableCustomDimensions();
	}, [
		settingsLoaded,
		syncAvailableAudiences,
		fetchSyncAvailableCustomDimensions,
	] );

	const onSaveClick = useCallback( () => {
		if ( isSavingUserInput || isSyncing ) {
			return;
		}

		if ( isInitialSetupFlow ) {
			trackEvent(
				`${ viewContext }_setup`,
				'setup_flow_v3_complete_key_metrics_step'
			);
		} else {
			trackEvent( viewContext, 'complete_key_metrics_step' );
		}

		submitChanges();
	}, [
		isSavingUserInput,
		isInitialSetupFlow,
		isSyncing,
		submitChanges,
		viewContext,
	] );

	let gaTrackingEventArgs;

	if ( isInitialSetupFlow ) {
		gaTrackingEventArgs = {
			category: `${ viewContext }_setup`,
			action: 'setup_flow_v3_select_key_metrics_answer',
		};
	} else {
		gaTrackingEventArgs = {
			category: viewContext,
			action: 'select_key_metrics_answer',
		};
	}

	const { USER_INPUT_ANSWERS_PURPOSE } = getUserInputAnswers();

	const {
		USER_INPUT_ANSWERS_PURPOSE: USER_INPUT_ANSWERS_PURPOSE_DESCRIPTIONS,
	} = getUserInputAnswersDescription();

	const subHeader = isInitialSetupFlow ? (
		<ProgressIndicator totalSegments={ 6 } currentSegment={ 4 } />
	) : null;

	const isCompleteSetupLoading =
		isSavingUserInput ||
		( ! saveUserInputError && isSavingInitialSetup ) || // Avoid a situation where both buttons are loading.
		isSyncing;

	return (
		<Fragment>
			<Header subHeader={ subHeader }>
				{ isInitialSetupFlow && (
					<ExitSetup
						gaTrackingEventArgs={ {
							category: `${ viewContext }_setup`,
							label: 'key-metrics',
						} }
					/>
				) }
				<HelpMenu />
			</Header>
			<div className="googlesitekit-key-metrics-setup">
				<div className="googlesitekit-module-page">
					<Grid>
						<Layout rounded>
							<Grid>
								<Row>
									<Cell size={ 12 }>
										<Typography
											as="h1"
											type="headline"
											size="medium"
											className="googlesitekit-key-metrics-setup__title"
										>
											{ __(
												'Tell us your main goal to get tailored metrics',
												'google-site-kit'
											) }
										</Typography>

										<div className="googlesitekit-key-metrics-setup__heading">
											<Typography
												as="h2"
												type="body"
												size="large"
											>
												{ __(
													'Which option most closely matches the purpose of your site?',
													'google-site-kit'
												) }
											</Typography>
											<P
												className="googlesitekit-key-metrics-setup__description"
												type="body"
												size="small"
											>
												{ createInterpolateElement(
													__(
														'Even if multiple options apply to your site, select the one that applies the most.<br />You can also answer or edit your response later in Settings.',
														'google-site-kit'
													),
													{
														br: <br />,
													}
												) }
											</P>
										</div>

										<UserInputSelectOptions
											slug={
												USER_INPUT_QUESTIONS_PURPOSE
											}
											max={
												USER_INPUT_MAX_ANSWERS[
													USER_INPUT_QUESTIONS_PURPOSE
												]
											}
											options={ omit(
												USER_INPUT_ANSWERS_PURPOSE,
												'other'
											) }
											descriptions={
												USER_INPUT_ANSWERS_PURPOSE_DESCRIPTIONS
											}
											gaTrackingEventArgs={
												gaTrackingEventArgs
											}
										/>

										{ saveInitialSetupError && (
											<div className="googlesitekit-user-input__error">
												<Notice
													description={ __(
														'Something went wrong, please try again',
														'google-site-kit'
													) }
													type={ NOTICE_TYPES.ERROR }
												/>
											</div>
										) }

										{ ! saveInitialSetupError &&
											!! saveUserInputError && (
												<div className="googlesitekit-user-input__error">
													<Notice
														title={ __(
															'Saving your answer failed',
															'google-site-kit'
														) }
														description={ __(
															'Retry to save your answer, or continue without saving. You can always edit your answer in Settings later.',
															'google-site-kit'
														) }
														type={
															NOTICE_TYPES.ERROR
														}
													/>
												</div>
											) }

										<div className="googlesitekit-user-input__footer">
											<SpinnerButton
												onClick={ onSaveClick }
												isSaving={
													isCompleteSetupLoading
												}
												disabled={
													hasErrorForAnswer(
														values
													) || isSyncing
												}
											>
												{ __(
													'Complete setup',
													'google-site-kit'
												) }
											</SpinnerButton>
											{ saveUserInputError && (
												<SpinnerButton
													onClick={ saveInitialSetup }
													isSaving={
														isSavingInitialSetup
													}
													tertiary
												>
													{ __(
														'Continue without saving',
														'google-site-kit'
													) }
												</SpinnerButton>
											) }
										</div>
									</Cell>
								</Row>
							</Grid>
						</Layout>
					</Grid>
				</div>
			</div>
			{ isGA4Connected && (
				<ToastNotice
					title={ __(
						'Google Analytics was successfully set up',
						'google-site-kit'
					) }
				/>
			) }
		</Fragment>
	);
}
