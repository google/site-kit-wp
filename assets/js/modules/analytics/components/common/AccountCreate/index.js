/**
 * AccountCreate component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../../../../components/button';
import Link from '../../../../../components/link';
import ProgressBar from '../../../../../components/progress-bar';
import { trackEvent } from '../../../../../util';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../../../../util/errors';
import TimezoneSelect from './TimezoneSelect';
import AccountField from './AccountField';
import PropertyField from './PropertyField';
import ProfileField from './ProfileField';
import CountrySelect from './CountrySelect';
import StoreErrorNotice from '../../../../../components/StoreErrorNotice';
import { STORE_NAME, FORM_ACCOUNT_CREATE, PROVISIONING_SCOPE } from '../../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { STORE_NAME as CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { getAccountDefaults } from '../../../util/account';
import Data from 'googlesitekit-data';

const { useDispatch, useSelect } = Data;

export default function AccountCreate() {
	const accountTicketTermsOfServiceURL = useSelect( ( select ) => select( STORE_NAME ).getAccountTicketTermsOfServiceURL() );
	const canSubmitAccountCreate = useSelect( ( select ) => select( STORE_NAME ).canSubmitAccountCreate() );
	const isDoingCreateAccount = useSelect( ( select ) => select( STORE_NAME ).isDoingCreateAccount() );
	const accounts = useSelect( ( select ) => select( STORE_NAME ).getAccounts() );
	const hasProvisioningScope = useSelect( ( select ) => select( CORE_USER ).hasScope( PROVISIONING_SCOPE ) );
	const hasAccountCreateForm = useSelect( ( select ) => select( CORE_FORMS ).hasForm( FORM_ACCOUNT_CREATE ) );
	const autoSubmit = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_ACCOUNT_CREATE, 'autoSubmit' ) );
	const siteURL = useSelect( ( select ) => select( CORE_SITE ).getReferenceSiteURL() );
	const siteName = useSelect( ( select ) => select( CORE_SITE ).getSiteName() );
	const timezone = useSelect( ( select ) => select( CORE_SITE ).getTimezone() );

	const [ isNavigating, setIsNavigating ] = useState( false );

	// Redirect if the accountTicketTermsOfServiceURL is set.
	useEffect( () => {
		if ( accountTicketTermsOfServiceURL ) {
			global.location.assign( accountTicketTermsOfServiceURL );
		}
	}, [ accountTicketTermsOfServiceURL ] );

	// Set form defaults on initial render.
	const { setValues } = useDispatch( CORE_FORMS );
	useEffect( () => {
		// Only set the form if not already present in store.
		// e.g. after a snapshot has been restored.
		if ( ! hasAccountCreateForm ) {
			setValues( FORM_ACCOUNT_CREATE, getAccountDefaults( {
				siteName,
				siteURL,
				timezone,
			} ) );
		}
	}, [ hasAccountCreateForm, siteName, siteURL, timezone ] );

	const { createAccount } = useDispatch( STORE_NAME );
	const { setPermissionScopeError } = useDispatch( CORE_USER );
	const handleSubmit = useCallback(
		async () => {
			// If scope not granted, trigger scope error right away. These are
			// typically handled automatically based on API responses, but
			// this particular case has some special handling to improve UX.
			if ( ! hasProvisioningScope ) {
				// When state is restored, auto-submit the request again.
				setValues( FORM_ACCOUNT_CREATE, { autoSubmit: true } );
				setPermissionScopeError( {
					code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
					message: __( 'Additional permissions are required to create a new Analytics account.', 'google-site-kit' ),
					data: {
						status: 403,
						scopes: [ PROVISIONING_SCOPE ],
						skipModal: true,
					},
				} );
				return;
			}

			setValues( FORM_ACCOUNT_CREATE, { autoSubmit: false } );
			await trackEvent( 'analytics_setup', 'new_account_setup_clicked' );
			const { error } = await createAccount();

			if ( ! error ) {
				setIsNavigating( true );
			}
		},
		[ createAccount, setIsNavigating, hasProvisioningScope, setPermissionScopeError ]
	);

	// If the user ends up back on this component with the provisioning scope granted,
	// and already submitted the form, trigger the submit again.
	useEffect( () => {
		if ( hasProvisioningScope && autoSubmit ) {
			handleSubmit();
		}
	}, [ hasProvisioningScope, autoSubmit, handleSubmit ] );

	// If the user clicks "Back", rollback settings to restore saved values, if any.
	const { rollbackSettings } = useDispatch( STORE_NAME );
	const handleBack = useCallback( () => rollbackSettings() );

	if ( isDoingCreateAccount || isNavigating || accounts === undefined || hasProvisioningScope === undefined ) {
		return <ProgressBar />;
	}

	return (
		<div>
			<StoreErrorNotice moduleSlug="analytics" storeName={ STORE_NAME } />

			<h3 className="googlesitekit-heading-4">
				{ __( 'Create your Analytics account', 'google-site-kit' ) }
			</h3>

			<p>
				{ __( 'We’ve pre-filled the required information for your new account. Confirm or edit any details:', 'google-site-kit' ) }
			</p>

			<div className="googlesitekit-setup-module__inputs">
				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
					<AccountField />
				</div>
				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
					<PropertyField />
				</div>
				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
					<ProfileField />
				</div>
			</div>

			<div className="googlesitekit-setup-module__inputs">
				<CountrySelect />

				<TimezoneSelect />
			</div>

			<p>
				{ hasProvisioningScope && __( 'You will be redirected to Google Analytics to accept the terms of service.', 'google-site-kit' ) }
				{ ! hasProvisioningScope && __( 'You will need to give Site Kit permission to create an Analytics account on your behalf and also accept the Google Analytics terms of service.', 'google-site-kit' ) }
			</p>

			<div className="googlesitekit-setup-module__action">
				<Button
					disabled={ ! canSubmitAccountCreate }
					onClick={ handleSubmit }
				>
					{ __( 'Create Account', 'google-site-kit' ) }
				</Button>

				{ ( accounts && !! accounts.length ) && (
					<Link
						className="googlesitekit-setup-module__sub-action"
						onClick={ handleBack }
					>
						{ __( 'Back', 'google-site-kit' ) }
					</Link>
				) }
			</div>
		</div>
	);
}
