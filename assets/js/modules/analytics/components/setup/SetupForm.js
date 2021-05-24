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
	STORE_NAME,
	FORM_SETUP,
	EDIT_SCOPE,
} from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { trackEvent } from '../../../../util';
import { isPermissionScopeError } from '../../../../util/errors';
import SetupFormLegacy from './SetupFormLegacy';
import SetupFormUA from './SetupFormUA';
import SetupFormGA4 from './SetupFormGA4';
import SetupFormGA4Transitional from './SetupFormGA4Transitional';
const { useSelect, useDispatch } = Data;

export default function SetupForm( { finishSetup } ) {
	const canSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).canSubmitChanges() );
	const hasEditScope = useSelect( ( select ) => select( CORE_USER ).hasScope( EDIT_SCOPE ) );
	const autoSubmit = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_SETUP, 'autoSubmit' ) );
	const setupFlowMode = useSelect( ( select ) => select( STORE_NAME ).getSetupFlowMode() );

	const { setValues } = useDispatch( CORE_FORMS );
	const { submitChanges } = useDispatch( STORE_NAME );
	const submitForm = useCallback( async ( event ) => {
		event.preventDefault();
		const { error } = await submitChanges();
		if ( isPermissionScopeError( error ) ) {
			setValues( FORM_SETUP, { autoSubmit: true } );
		}
		if ( ! error ) {
			setValues( FORM_SETUP, { autoSubmit: false } );
			await trackEvent( 'analytics_setup', 'analytics_configured' );
			finishSetup();
		}
	}, [ finishSetup, setValues, submitChanges ] );

	// If the user lands back on this component with autoSubmit and the edit scope,
	// resubmit the form.
	useEffect( () => {
		if ( autoSubmit && hasEditScope ) {
			submitForm( { preventDefault: () => {} } );
		}
	}, [ hasEditScope, autoSubmit, submitForm ] );

	return (
		<form className="googlesitekit-analytics-setup__form" onSubmit={ submitForm }>
			{ setupFlowMode === SETUP_FLOW_MODE_LEGACY && <SetupFormLegacy /> }
			{ setupFlowMode === SETUP_FLOW_MODE_UA && <SetupFormUA /> }
			{ setupFlowMode === SETUP_FLOW_MODE_GA4 && <SetupFormGA4 /> }
			{ setupFlowMode === SETUP_FLOW_MODE_GA4_TRANSITIONAL && <SetupFormGA4Transitional /> }
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
