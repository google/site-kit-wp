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
import { STORE_NAME } from '../datastore/constants';

import Data from 'googlesitekit-data';
const { useDispatch, useSelect } = Data;

const AccountCreate = () => {
	const isDoingCreateAccount = useSelect(
		( select ) => {
			return select( STORE_NAME ).isDoingCreateAccount();
		},
		[]
	);
	const accountTicketTermsOfServiceURL = useSelect(
		( select ) => {
			return select( STORE_NAME ).getAccountTicketTermsOfServiceURL();
		},
		[]
	);

	const { createAccount } = useDispatch( STORE_NAME );

	// Redirect if the accountTicketTermsOfServiceURL is set.
	if ( accountTicketTermsOfServiceURL ) {
		location = accountTicketTermsOfServiceURL;
	}

	const { siteName, siteURL, timezone: tz } = global.googlesitekit.admin;

	const handleSubmit = useCallback( ( accountName, propertyName, profileName, timezone ) => {
		trackEvent( 'analytics_setup', 'new_account_setup_clicked' );
		setIsSubmitting( true );
		createAccount( {
			accountName,
			propertyName,
			profileName,
			timezone,
		} ).then( () => {
			// Log error message?
			setIsSubmitting( false );
		} );
	} );

	const url = new URL( siteURL );

	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const [ accountName, setAccountName ] = useState( siteName );
	const [ propertyName, setPropertyName ] = useState( url.hostname );
	const [ profileName, setProfileName ] = useState( __( 'All website traffic', 'google-site-kit' ) );
	const [ timezone, setTimezone ] = useState( tz );
	const [ validationIssues, setValidationIssues ] = useState( {
		accountName: accountName === '',
		propertyName: propertyName === '',
		profileName: profileName === '',
		timezone: timezone === '',
	} );

	// Disable the submit button if there are validation errors, and while submission is in progress.
	const buttonDisabled = Object.values( validationIssues ).some( ( check ) => check ) ||
		isDoingCreateAccount ||
		isSubmitting;

	return (
		<Fragment>
			<div className="googlesitekit-setup-module">
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell--span-12">
						<h2>
							{ __( 'Create new Analytics account', 'google-site-kit' ) }
						</h2>
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
													validationIssues={ validationIssues }
													setValidationIssues={ setValidationIssues }
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
