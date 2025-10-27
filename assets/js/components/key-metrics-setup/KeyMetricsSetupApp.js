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
import ExitSetup from '@/js/components/setup/ExitSetup';
import Header from '@/js/components/Header';
import Layout from '@/js/components/layout/Layout';
import ErrorNotice from '@/js/components/ErrorNotice';
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
import WarningSVG from '@/svg/icons/warning.svg';
import useQueryArg from '@/js/hooks/useQueryArg';

export default function KeyMetricsSetupApp() {
	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const settings = useSelect( ( select ) =>
		select( CORE_USER ).getUserInputSettings()
	);
	const isSavingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingUserInputSettings( settings )
	);
	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigating()
	);
	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 )
	);

	const error = useSelect( ( select ) =>
		select( CORE_USER ).getErrorForAction( 'saveUserInputSettings', [] )
	);

	const values = useSelect(
		( select ) =>
			select( CORE_USER ).getUserInputSetting(
				USER_INPUT_QUESTIONS_PURPOSE
			) || []
	);

	const { saveUserInputSettings } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const submitChanges = useCallback( async () => {
		const response = await saveUserInputSettings();
		if ( ! response.error ) {
			const url = new URL( dashboardURL );
			navigateTo( url.toString() );
		}
	}, [ saveUserInputSettings, dashboardURL, navigateTo ] );

	const isBusy = isSavingSettings || isNavigating;

	const isFetchingSyncAvailableCustomDimensions = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isFetchingSyncAvailableCustomDimensions()
	);
	const isSyncingAudiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isSyncingAudiences()
	);

	const isSyncing =
		isFetchingSyncAvailableCustomDimensions || isSyncingAudiences;

	const { fetchSyncAvailableCustomDimensions, syncAvailableAudiences } =
		useDispatch( MODULES_ANALYTICS_4 );

	useEffect( () => {
		syncAvailableAudiences();
		fetchSyncAvailableCustomDimensions();
	}, [ syncAvailableAudiences, fetchSyncAvailableCustomDimensions ] );

	const onSaveClick = useCallback( () => {
		if ( isBusy || isSyncing ) {
			return;
		}

		submitChanges();
	}, [ isBusy, isSyncing, submitChanges ] );

	const { USER_INPUT_ANSWERS_PURPOSE } = getUserInputAnswers();

	const {
		USER_INPUT_ANSWERS_PURPOSE: USER_INPUT_ANSWERS_PURPOSE_DESCRIPTIONS,
	} = getUserInputAnswersDescription();

	const [ showProgress ] = useQueryArg( 'showProgress' );

	const isInitialSetupFlow = !! showProgress;

	const subHeader = isInitialSetupFlow ? (
		<ProgressIndicator totalSegments={ 6 } currentSegment={ 4 } />
	) : null;

	return (
		<Fragment>
			<Header subHeader={ subHeader }>
				{ isInitialSetupFlow && <ExitSetup /> }
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
										/>

										{ error && (
											<ErrorNotice
												error={ error }
												Icon={ WarningSVG }
											/>
										) }

										<div className="googlesitekit-user-input__footer">
											<SpinnerButton
												onClick={ onSaveClick }
												isSaving={ isBusy || isSyncing }
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
