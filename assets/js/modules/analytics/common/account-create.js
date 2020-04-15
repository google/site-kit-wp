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
import { useState, Fragment, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../../components/button';
import ProgressBar from '../../../components/progress-bar';
import { trackEvent } from '../../../util';
import TimezoneSelect from './timzezone-select';
import AccountField from './account-field';
import PropertyField from './property-field';
import ProfileField from './profile-field';

// import Data from 'googlesitekit-data';
// const { dispatch, select } = Data;

const AccountCreate = () => {
	// const { createAccount } = dispatch( STORE_NAME );
	// const isDoingCreateAccount = select( STORE_NAME ).isDoingCreateAccount();
	const isDoingCreateAccount = false;
	const { createAccount } = () => {};
	const { siteName, siteURL, timezone: tz, errorcode } = global.googlesitekit.admin;

	// Handle expected provisioning flow error codes.
	let errorMessage = false;
	switch ( errorcode ) {
		case 'user_cancel':
			errorMessage = __( 'The Terms of Service were not accepted.', 'google-site-kit' );
			break;

		case 'max_accounts_reached':
			errorMessage = __( 'The Google Analytics account limit has been reached.', 'google-site-kit' );
			break;

		case 'backend_error':
			errorMessage = __( 'Unknown service error.', 'google-site-kit' );
			break;
	}
	const [ error, setError ] = useState( errorMessage );

	const handleSubmit = useCallback( ( accountName, propertyName, profileName, timezone ) => {
		trackEvent( 'analytics_setup', 'new_account_setup_clicked' );
		createAccount( {
			accountName,
			propertyName,
			profileName,
			timezone,
		} ).then( ( e ) => {
			const { error: err } = e.payload;
			if ( err ) {
				setError( err.message ? err.message : __( 'Unknown error.', 'google-site-kit' ) );
			}
		} );
	} );

	const [ accountName, setAccountName ] = useState( siteName );
	const [ propertyName, setPropertyName ] = useState( siteURL );
	const [ profileName, setProfileName ] = useState( __( 'All website traffic', 'google-site-kit' ) );
	const [ validationIssues, setValidationIssues ] = useState( {} );
	const [ timezone, setTimezone ] = useState( tz );

	// Disable the submit button if there are validation errors, and while submission is in progress.
	const buttonDisabled = validationIssues.accountName || validationIssues.propertyName || validationIssues.profileName || isDoingCreateAccount;

	return (
		<Fragment>
			<div className="googlesitekit-setup-module">
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell--span-12">
						<h2>
							{ __( 'Create new Analytics account', 'google-site-kit' ) }
						</h2>
						{
							error &&
							<div className="error">
								<p>
									{ error }
								</p>
							</div>
						}
						<div className="mdc-layout-grid">
							{
								isDoingCreateAccount
									? <ProgressBar />
									: <div>
										<p>
											{ __( 'Confirm your account details:', 'google-site-kit' ) }
										</p>
										<div className="googlesitekit-setup-module__inputs">
											<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
												<AccountField
													validationIssues={ validationIssues }
													setValidationIssues={ setValidationIssues }
													accountName={ accountName }
													setAccountName={ setAccountName }
												/>
											</div>
											<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
												<PropertyField
													validationIssues={ validationIssues }
													setValidationIssues={ setValidationIssues }
													propertyName={ propertyName }
													setPropertyName={ setPropertyName }
												/>
											</div>
											<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
												<ProfileField
													validationIssues={ validationIssues }
													setValidationIssues={ setValidationIssues }
													profileName={ profileName }
													setProfileName={ setProfileName }
												/>
											</div>
											<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
												<TimezoneSelect
													timezone={ timezone }
													setTimezone={ setTimezone }
												/>
											</div>
										</div>
									</div>
							}
						</div>
						<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
							<Button
								disabled={ buttonDisabled }
								onClick={ () => {
									handleSubmit( accountName, propertyName, profileName, timezone );
								} }
							>
								{ __( 'Create Account', 'google-site-kit' ) }
							</Button>
						</div>
					</div>
				</div>
			</div>
		</Fragment>
	);
};

export default AccountCreate;
