/**
 * Analytics Setup form.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button, ProgressBar } from 'googlesitekit-components';
import {
	SETUP_FLOW_MODE_UA,
	SETUP_FLOW_MODE_GA4,
	SETUP_FLOW_MODE_GA4_TRANSITIONAL,
	MODULES_ANALYTICS,
	FORM_SETUP,
	EDIT_SCOPE,
	SETUP_FLOW_MODE_GA4_LEGACY,
	DASHBOARD_VIEW_GA4,
} from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { isPermissionScopeError } from '../../../../util/errors';
import SetupFormUA from './SetupFormUA';
import SetupFormGA4 from './SetupFormGA4';
import SetupFormGA4Legacy from './SetupFormGA4Legacy';
import SetupFormGA4Transitional from './SetupFormGA4Transitional';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { ExistingGTMPropertyNotice } from '../common';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { useFeature } from '../../../../hooks/useFeature';
const { useSelect, useDispatch } = Data;

export default function SetupForm( { finishSetup } ) {
	const ga4ReportingEnabled = useFeature( 'ga4Reporting' );
	const canSubmitUAChanges = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).canSubmitChanges()
	);
	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);
	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'autoSubmit' )
	);
	const setupFlowMode = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getSetupFlowMode()
	);
	const isUAEnabled = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'enableUA' )
	);
	const canSubmitGA4Changes = useSelect( ( select ) => {
		const canSubmitChanges =
			select( MODULES_ANALYTICS_4 ).canSubmitChanges();

		if ( isUAEnabled ) {
			return canSubmitUAChanges && canSubmitChanges;
		}

		return canSubmitChanges;
	} );

	const { setValues } = useDispatch( CORE_FORMS );
	const { setDashboardView, submitChanges } =
		useDispatch( MODULES_ANALYTICS );

	const submitForm = useCallback(
		async ( event ) => {
			event.preventDefault();
			// Disable autoSubmit unconditionally to prevent
			// automatic invocation more than once.
			setValues( FORM_SETUP, { autoSubmit: false } );

			// Automatically switch sites going through the new GA4
			// setup flow to the GA4 dashboard view.
			if (
				ga4ReportingEnabled &&
				setupFlowMode === SETUP_FLOW_MODE_GA4
			) {
				setDashboardView( DASHBOARD_VIEW_GA4 );
			}

			const { error } = await submitChanges();

			if ( isPermissionScopeError( error ) ) {
				setValues( FORM_SETUP, { autoSubmit: true } );
			}

			if ( ! error ) {
				finishSetup();
			}
		},
		[
			finishSetup,
			ga4ReportingEnabled,
			setDashboardView,
			setValues,
			setupFlowMode,
			submitChanges,
		]
	);

	const isTagManagerAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'tagmanager' )
	);
	const gtmAnalyticsPropertyID = useSelect(
		( select ) =>
			isTagManagerAvailable &&
			select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID()
	);
	const gtmContainersResolved = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).hasFinishedLoadingGTMContainers()
	);

	// If the user lands back on this component with autoSubmit and the edit scope,
	// resubmit the form.
	useEffect( () => {
		if ( autoSubmit && hasEditScope ) {
			submitForm( { preventDefault: () => {} } );
		}
	}, [ hasEditScope, autoSubmit, submitForm ] );

	if ( ! gtmContainersResolved ) {
		return <ProgressBar />;
	}

	return (
		<form
			className="googlesitekit-analytics-setup__form"
			onSubmit={ submitForm }
		>
			{ ! ga4ReportingEnabled && (
				<ExistingGTMPropertyNotice
					gtmAnalyticsPropertyID={ gtmAnalyticsPropertyID }
				/>
			) }
			<StoreErrorNotices
				moduleSlug="analytics"
				storeName={ MODULES_ANALYTICS }
			/>
			<StoreErrorNotices
				moduleSlug="analytics-4"
				storeName={ MODULES_ANALYTICS_4 }
			/>
			{ setupFlowMode === SETUP_FLOW_MODE_UA && <SetupFormUA /> }
			{ setupFlowMode === SETUP_FLOW_MODE_GA4 && <SetupFormGA4 /> }
			{ setupFlowMode === SETUP_FLOW_MODE_GA4_LEGACY && (
				<SetupFormGA4Legacy />
			) }
			{ setupFlowMode === SETUP_FLOW_MODE_GA4_TRANSITIONAL && (
				<SetupFormGA4Transitional />
			) }
			<div className="googlesitekit-setup-module__action">
				<Button
					disabled={
						ga4ReportingEnabled
							? ! canSubmitGA4Changes
							: ! canSubmitUAChanges
					}
				>
					{ __( 'Configure Analytics', 'google-site-kit' ) }
				</Button>
			</div>
		</form>
	);
}

SetupForm.propTypes = {
	finishSetup: PropTypes.func,
};

SetupForm.defaultProps = {
	finishSetup: () => {},
};
