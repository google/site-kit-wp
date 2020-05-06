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
import Button from '../../../components/button';
import ProgressBar from '../../../components/progress-bar';
import { trackEvent } from '../../../util';
import TimezoneSelect from './timzezone-select';
import AccountField from './account-field';
import PropertyField from './property-field';
import ProfileField from './profile-field';
import { STORE_NAME } from '../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import Data from 'googlesitekit-data';
import CountrySelect from './country-select';
import { countriesByCode, countryCodesByTimezone, countriesByTimeZone } from '../util/countries-timezones';
const { useDispatch, useSelect } = Data;

export default function AccountCreate() {
	const accountTicketTermsOfServiceURL = useSelect( ( select ) => select( STORE_NAME ).getAccountTicketTermsOfServiceURL() );
	const isDoingCreateAccount = useSelect( ( select ) => select( STORE_NAME ).isDoingCreateAccount() );
	const siteURL = useSelect( ( select ) => select( CORE_SITE ).getReferenceSiteURL() );
	const siteName = useSelect( ( select ) => select( CORE_SITE ).getSiteName() );
	const tz = useSelect( ( select ) => select( CORE_SITE ).getTimezone() );

	const url = new URL( siteURL );
	const { createAccount } = useDispatch( STORE_NAME );

	const [ isNavigating, setIsNavigating ] = useState( false );

	// Redirect if the accountTicketTermsOfServiceURL is set.
	if ( accountTicketTermsOfServiceURL ) {
		global.location.assign( accountTicketTermsOfServiceURL );
	}
	const [ accountName, setAccountName ] = useState( siteName );
	const [ propertyName, setPropertyName ] = useState( url.hostname );
	const [ profileName, setProfileName ] = useState( __( 'All website traffic', 'google-site-kit' ) );
	const [ timezone, setTimezone ] = useState( tz );
	const [ countryCode, setCountryCode ] = useState( countryCodesByTimezone[ tz ] );
	const [ validationIssues, setValidationIssues ] = useState( {} );

	const validationHasIssues = Object.values( validationIssues ).some( Boolean );

	// Check timezone on initial load: fall back to the browser timezone if the WordPress timezone was not found.
	useEffect( () => {
		const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		if ( timezone && timezone !== browserTimeZone && ! countriesByTimeZone[ timezone ] ) {
			setTimezone( browserTimeZone );
		}
	}, [ timezone ] );

	const handleSubmit = useCallback(
		async () => {
			trackEvent( 'analytics_setup', 'new_account_setup_clicked' );
			const result = await createAccount( {
				accountName,
				propertyName,
				profileName,
				timezone,
			} );

			if ( ! result.error ) {
				setIsNavigating( true );
			}
		},
		[ setIsNavigating, accountName, propertyName, profileName, timezone ]
	);

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
		<div>
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
					<CountrySelect
						hasError={ validationIssues.country }
						value={ countryCode }
						onEnhancedChange={ ( i, item ) => {
							const newCountryCode = item.dataset.value;
							if ( newCountryCode !== countryCode ) {
								setCountryCode( newCountryCode );
								setTimezone( countriesByCode[ newCountryCode ].defaultTimeZoneId );
							}
						} }
					/>
				</div>
				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
					<TimezoneSelect
						countryCode={ countryCode }
						hasError={ validationIssues.timezone }
						value={ timezone }
						onEnhancedChange={ ( i, item ) => setTimezone( item.dataset.value ) }
					/>
				</div>
			</div>

			<p>
				{ __( 'You will be redirected to Google Analytics to accept the Terms of Service and create your new account.', 'google-site-kit' ) }
			</p>

			<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
				<Button
					disabled={ validationHasIssues }
					onClick={ handleSubmit }
				>
					{ __( 'Create Account', 'google-site-kit' ) }
				</Button>
			</div>
		</div>
	);
}
