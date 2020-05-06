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
 * External dependencies
 */
import { each } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, Fragment, useEffect } from '@wordpress/element';

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
import { countries } from './countries';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import Data from 'googlesitekit-data';
import ErrorNotice from './error-notice';

const { useDispatch, useSelect } = Data;

// Recursively search thru countries and their timezones to find a match for country/timezone.
const timezoneInCountries = ( timezone ) => {
	let matched = false;
	each( countries.default.country, ( country ) => {
		const timezoneMatch = country.timeZone.find( ( tz ) => tz.timeZoneId === timezone );
		if ( timezoneMatch ) {
			matched = true;
		}
	} );
	return matched;
};
let timezoneChecked = false;

const AccountCreate = () => {
	const siteURL = useSelect( ( select ) => select( CORE_SITE ).getReferenceSiteURL() );
	const siteName = useSelect( ( select ) => select( CORE_SITE ).getSiteName() );
	let tz = useSelect( ( select ) => select( CORE_SITE ).getTimezone() );
	const accountTicketTermsOfServiceURL = useSelect( ( select ) => select( STORE_NAME ).getAccountTicketTermsOfServiceURL() );
	const isDoingCreateAccount = useSelect( ( select ) => select( STORE_NAME ).isDoingCreateAccount() );
	const url = new URL( siteURL );
	const [ accountName, setAccountName ] = useState( siteName );
	const [ propertyName, setPropertyName ] = useState( url.hostname );
	const [ profileName, setProfileName ] = useState( __( 'All website traffic', 'google-site-kit' ) );
	const [ isNavigating, setIsNavigating ] = useState( false );
	const [ validationIssues, setValidationIssues ] = useState( {
		accountName: accountName === '',
		propertyName: propertyName === '',
		profileName: profileName === '',
		timezone: timezone === '',
	} );

	// Check timezone on initial load: fall back to the browser timezone if the WordPress timezone was not found.
	if ( ! timezoneChecked && ! timezoneInCountries( tz ) ) {
		tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	}
	timezoneChecked = true;
	const [ timezone, setTimezone ] = useState( tz );

	const { createAccount } = useDispatch( STORE_NAME );

	useEffect( () => {
		setValidationIssues( {
			accountName: accountName === '',
			propertyName: propertyName === '',
			profileName: profileName === '',
			timezone: timezone === '',
		} );
	}, [ accountName, propertyName, profileName, timezone ] );

	const handleSubmit = async function( submittedAccountName, submittedPropertyName, submittedProfileName, submittedTimezone ) {
		trackEvent( 'analytics_setup', 'new_account_setup_clicked' );
		const result = await createAccount( {
			accountName: submittedAccountName,
			propertyName: submittedPropertyName,
			profileName: submittedProfileName,
			timezone: submittedTimezone,
		} );

		if ( ! result.error ) {
			setIsNavigating( true );
		}
	};

	// Redirect if the accountTicketTermsOfServiceURL is set.
	if ( accountTicketTermsOfServiceURL ) {
		global.location.assign( accountTicketTermsOfServiceURL );
	}

	const validationHasIssues = Object.values( validationIssues ).some( ( check ) => check );

	if ( isDoingCreateAccount || isNavigating ) {
		return <ProgressBar />;
	}

	return (
		<Fragment>
			<div className="googlesitekit-setup-module">
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell--span-12">
						<div className="mdc-layout-grid">
							<ErrorNotice />
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
