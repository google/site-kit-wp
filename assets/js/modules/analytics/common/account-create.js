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
import { useState, Fragment, useCallback, useEffect } from '@wordpress/element';

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
	const siteURL = useSelect( ( select ) => select( 'core/site' ).getReferenceSiteURL() );
	const siteName = useSelect( ( select ) => select( 'core/site' ).getSiteName() );
	const tz = useSelect( ( select ) => select( 'core/site' ).getTimezone() );
	const url = new URL( siteURL );
	const { createAccount } = useDispatch( STORE_NAME );

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
		[ isDoingCreateAccount ]
	);
	const [ isNavigating, setIsNavigating ] = useState( false );
	const handleSubmit = useCallback( ( accountName, propertyName, profileName, timezone ) => {
		trackEvent( 'analytics_setup', 'new_account_setup_clicked' );
		setIsNavigating( true );
		async function send() {
			await createAccount( {
				accountName,
				propertyName,
				profileName,
				timezone,
			} );

			// Redirect if the accountTicketTermsOfServiceURL is set.
			if ( accountTicketTermsOfServiceURL ) {
				global.location.assign( accountTicketTermsOfServiceURL );
			}
			setIsNavigating( false );
		}
		send();
	}, [ accountTicketTermsOfServiceURL ] );

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

	const validationHasIssues = Object.values( validationIssues ).some( ( check ) => check );

	useEffect( () => {
		setValidationIssues( {
			accountName: accountName === '',
			propertyName: propertyName === '',
			profileName: profileName === '',
			timezone: timezone === '',
		} );
	}, [ accountName, propertyName, profileName, timezone ] );

	if ( isDoingCreateAccount || isNavigating ) {
		return <ProgressBar />;
	}

	return (
		<Fragment>
			<div className="googlesitekit-setup-module">
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell--span-12">
						<div className="mdc-layout-grid">
							<h3 className="googlesitekit-heading-4">
								{ __( 'Create new Analytics account', 'google-site-kit' ) }
							</h3>
							{ __( 'We’ve pre-filled the required information for your new account. Confirm or edit any details:', 'google-site-kit' ) }
							<div className="googlesitekit-setup-module__inputs">
								<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
									<AccountField
										hasError={ validationIssues.accountName }
										value={ accountName }
										setValue={ setAccountName }
									/>
								</div>
								<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
									<PropertyField
										hasError={ validationIssues.propertyName }
										value={ propertyName }
										setValue={ setPropertyName }
									/>
								</div>
								<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
									<ProfileField
										hasError={ validationIssues.profileName }
										value={ profileName }
										setValue={ setProfileName }
									/>
								</div>
								<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
									<TimezoneSelect
										hasError={ validationIssues.timezone }
										timezone={ timezone }
										setTimezone={ setTimezone }
									/>
								</div>
							</div>
							<p>
								{ __( 'You will be redirected to Google Analytics to accept the Terms of Service and create your new account.', 'google-site-kit' ) }
							</p>
							<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
								<Button
									disabled={ validationHasIssues }
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
			</div>
		</Fragment>
	);
};

export default AccountCreate;
