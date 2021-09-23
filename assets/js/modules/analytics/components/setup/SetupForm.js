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
import Button from '../../../../components/Button';
import {
	SETUP_FLOW_MODE_LEGACY,
	SETUP_FLOW_MODE_UA,
	SETUP_FLOW_MODE_GA4,
	SETUP_FLOW_MODE_GA4_TRANSITIONAL,
	MODULES_ANALYTICS,
	FORM_SETUP,
	EDIT_SCOPE,
	PROPERTY_CREATE,
	PROFILE_CREATE,
} from '../../datastore/constants';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE as GA4_PROPERTY_CREATE,
	WEBDATASTREAM_CREATE,
} from '../../../analytics-4/datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { trackEvent } from '../../../../util';
import {
	ERROR_CODE_MISSING_REQUIRED_SCOPE,
	isPermissionScopeError,
} from '../../../../util/errors';
import { useFeature } from '../../../../hooks/useFeature';
import SetupFormLegacy from './SetupFormLegacy';
import SetupFormUA from './SetupFormUA';
import SetupFormGA4 from './SetupFormGA4';
import SetupFormGA4Transitional from './SetupFormGA4Transitional';
const { useSelect, useDispatch } = Data;

export default function SetupForm( { finishSetup } ) {
	const isGA4Enabled = useFeature( 'ga4setup' );

	const canSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).canSubmitChanges()
	);
	const uaPropertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPropertyID()
	);
	const uaProfileID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getProfileID()
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

	const ga4PropertyID = useSelect( ( select ) =>
		isGA4Enabled ? select( MODULES_ANALYTICS_4 ).getPropertyID() : ''
	);
	const ga4WebDataStreamID = useSelect( ( select ) =>
		isGA4Enabled ? select( MODULES_ANALYTICS_4 ).getWebDataStreamID() : ''
	);

	const { setPermissionScopeError } = useDispatch( CORE_USER );
	const { setValues } = useDispatch( CORE_FORMS );
	const { submitChanges } = useDispatch( MODULES_ANALYTICS );
	const submitForm = useCallback(
		async ( event ) => {
			event.preventDefault();

			const scopes = [];

			if (
				! hasEditScope &&
				( uaPropertyID === PROPERTY_CREATE ||
					uaProfileID === PROFILE_CREATE ||
					ga4PropertyID === GA4_PROPERTY_CREATE ||
					ga4WebDataStreamID === WEBDATASTREAM_CREATE )
			) {
				scopes.push( EDIT_SCOPE );
			}

			// If scope not granted, trigger scope error right away. These are
			// typically handled automatically based on API responses, but
			// this particular case has some special handling to improve UX.
			if ( scopes.length > 0 ) {
				// When state is restored, auto-submit the request again.
				setValues( FORM_SETUP, { autoSubmit: true } );
				setPermissionScopeError( {
					code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
					message: __(
						'Additional permissions are required to save Analytics settings.',
						'google-site-kit'
					),
					data: {
						status: 403,
						scopes,
						skipModal: false,
					},
				} );
				return;
			}

			const { error } = await submitChanges();
			if ( isPermissionScopeError( error ) ) {
				setValues( FORM_SETUP, { autoSubmit: true } );
			}

			if ( ! error ) {
				setValues( FORM_SETUP, { autoSubmit: false } );
				await trackEvent( 'analytics_setup', 'analytics_configured' );
				finishSetup();
			}
		},
		[
			finishSetup,
			hasEditScope,
			setPermissionScopeError,
			setValues,
			submitChanges,
			ga4PropertyID,
			ga4WebDataStreamID,
			uaProfileID,
			uaPropertyID,
		]
	);

	// If the user lands back on this component with autoSubmit and the edit scope,
	// resubmit the form.
	useEffect( () => {
		if ( autoSubmit && hasEditScope ) {
			submitForm( { preventDefault: () => {} } );
		}
	}, [ hasEditScope, autoSubmit, submitForm ] );

	return (
		<form
			className="googlesitekit-analytics-setup__form"
			onSubmit={ submitForm }
		>
			{ setupFlowMode === SETUP_FLOW_MODE_LEGACY && <SetupFormLegacy /> }
			{ setupFlowMode === SETUP_FLOW_MODE_UA && <SetupFormUA /> }
			{ setupFlowMode === SETUP_FLOW_MODE_GA4 && <SetupFormGA4 /> }
			{ setupFlowMode === SETUP_FLOW_MODE_GA4_TRANSITIONAL && (
				<SetupFormGA4Transitional />
			) }
			<div className="googlesitekit-setup-module__action">
				<Button disabled={ ! canSubmitChanges }>
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
