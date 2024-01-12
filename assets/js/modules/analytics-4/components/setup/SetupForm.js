/**
 * Analytics Setup form.
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
import { SpinnerButton, ProgressBar } from 'googlesitekit-components';
import { FORM_SETUP, EDIT_SCOPE } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import { isPermissionScopeError } from '../../../../util/errors';
import SetupFormFields from './SetupFormFields';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	MODULES_ANALYTICS_4,
} from '../../../analytics-4/datastore/constants';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';
const { useSelect, useDispatch } = Data;

export default function SetupForm( { finishSetup } ) {
	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);
	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'autoSubmit' )
	);
	const canSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).canSubmitChanges()
	);
	const isSaving = useSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).isDoingSubmitChanges() ||
			select( CORE_LOCATION ).isNavigating()
	);
	const viewContext = useViewContext();

	const { setValues } = useDispatch( CORE_FORMS );
	const { submitChanges } = useDispatch( MODULES_ANALYTICS_4 );

	const isEnhancedMeasurementEnabled = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			ENHANCED_MEASUREMENT_FORM,
			ENHANCED_MEASUREMENT_ENABLED
		)
	);

	const submitForm = useCallback(
		async ( event ) => {
			event.preventDefault();
			// Disable autoSubmit unconditionally to prevent
			// automatic invocation more than once.
			setValues( FORM_SETUP, { autoSubmit: false } );

			const { error } = await submitChanges();

			if ( isPermissionScopeError( error ) ) {
				setValues( FORM_SETUP, { autoSubmit: true } );
			}

			if ( ! error ) {
				if ( isEnhancedMeasurementEnabled === true ) {
					await trackEvent(
						`${ viewContext }_analytics`,
						'ga4_setup_enhanced_measurement_enabled'
					);
				}
				finishSetup();
			}
		},
		[
			finishSetup,
			isEnhancedMeasurementEnabled,
			setValues,
			submitChanges,
			viewContext,
		]
	);

	const gtmContainersResolved = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedLoadingGTMContainers()
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
			<StoreErrorNotices
				moduleSlug="analytics-4"
				storeName={ MODULES_ANALYTICS_4 }
			/>
			<SetupFormFields />
			<div className="googlesitekit-setup-module__action">
				<SpinnerButton
					disabled={ ! canSubmitChanges || isSaving }
					isSaving={ isSaving }
				>
					{ __( 'Configure Analytics', 'google-site-kit' ) }
				</SpinnerButton>
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
