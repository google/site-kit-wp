/**
 * Analytics Setup form.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { STORE_NAME, PROFILE_CREATE, FORM_SETUP, EDIT_SCOPE } from '../../datastore/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { STORE_NAME as CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	AccountSelect,
	ExistingGTMPropertyNotice,
	ExistingTagNotice,
	ProfileSelect,
	PropertySelect,
	ProfileNameTextField,
} from '../common';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import GA4Notice from '../common/GA4Notice';
import { trackEvent } from '../../../../util';
import { isPermissionScopeError } from '../../../../util/errors';
const { useSelect, useDispatch } = Data;

export default function SetupForm( { finishSetup } ) {
	const accounts = useSelect( ( select ) => select( STORE_NAME ).getAccounts() ) || [];
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const canSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).canSubmitChanges() );
	const hasEditScope = useSelect( ( select ) => select( CORE_USER ).hasScope( EDIT_SCOPE ) );
	const autoSubmit = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_SETUP, 'autoSubmit' ) );
	// Needed to conditionally show the profile name field and surrounding container.
	const profileID = useSelect( ( select ) => select( STORE_NAME ).getProfileID() );

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
	}, [ canSubmitChanges, finishSetup ] );

	// If the user lands back on this component with autoSubmit and the edit scope,
	// resubmit the form.
	useEffect( () => {
		if ( autoSubmit && hasEditScope ) {
			submitForm( { preventDefault: () => {} } );
		}
	}, [ hasEditScope, autoSubmit, submitForm ] );

	return (
		<form className="googlesitekit-analytics-setup__form" onSubmit={ submitForm }>
			<GA4Notice />
			<StoreErrorNotices moduleSlug="analytics" storeName={ STORE_NAME } />
			<ExistingTagNotice />
			{ ! hasExistingTag && <ExistingGTMPropertyNotice /> }

			{ ( !! accounts.length && ! hasExistingTag ) && (
				<p className="googlesitekit-margin-bottom-0">
					{ __( 'Please select the account information below. You can change this view later in your settings.', 'google-site-kit' ) }
				</p>
			) }

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />

				<PropertySelect />

				<ProfileSelect />
			</div>

			{ profileID === PROFILE_CREATE && (
				<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
					<ProfileNameTextField />
				</div>
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
