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
import Link from '../../../components/link';
import ProgressBar from '../../../components/progress-bar';
import { trackEvent } from '../../../util';
import TimezoneSelect from './account-create/timezone-select';
import AccountField from './account-create/account-field';
import PropertyField from './account-create/property-field';
import ProfileField from './account-create/profile-field';
import CountrySelect from './account-create/country-select';
import ErrorNotice from './error-notice';
import { STORE_NAME, FORM_ACCOUNT_CREATE } from '../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { countryCodesByTimezone } from '../util/countries-timezones';
import Data from 'googlesitekit-data';

const { useDispatch, useSelect } = Data;

export default function AccountCreate() {
	const accountTicketTermsOfServiceURL = useSelect( ( select ) => select( STORE_NAME ).getAccountTicketTermsOfServiceURL() );
	const canSubmitAccountCreate = useSelect( ( select ) => select( STORE_NAME ).canSubmitAccountCreate() );
	const isDoingCreateAccount = useSelect( ( select ) => select( STORE_NAME ).isDoingCreateAccount() );
	const siteURL = useSelect( ( select ) => select( CORE_SITE ).getReferenceSiteURL() );
	const siteName = useSelect( ( select ) => select( CORE_SITE ).getSiteName() );
	let timezone = useSelect( ( select ) => select( CORE_SITE ).getTimezone() );

	const [ isNavigating, setIsNavigating ] = useState( false );

	// Redirect if the accountTicketTermsOfServiceURL is set.
	useEffect( () => {
		if ( accountTicketTermsOfServiceURL ) {
			global.location.assign( accountTicketTermsOfServiceURL );
		}
	}, [ accountTicketTermsOfServiceURL ] );

	// Set form defaults on initial render.
	const { setForm } = useDispatch( STORE_NAME );
	useEffect( () => {
		const { hostname } = new URL( siteURL );
		timezone = countryCodesByTimezone[ timezone ] ? timezone : Intl.DateTimeFormat().resolvedOptions().timeZone;
		setForm( FORM_ACCOUNT_CREATE, {
			accountName: siteName,
			propertyName: hostname,
			profileName: __( 'All website traffic', 'google-site-kit' ),
			countryCode: countryCodesByTimezone[ timezone ],
			timezone,
		} );
	}, [ siteName, siteURL, timezone ] );

	const { createAccount } = useDispatch( STORE_NAME );
	const handleSubmit = useCallback(
		async () => {
			trackEvent( 'analytics_setup', 'new_account_setup_clicked' );
			const { error } = await createAccount();

			if ( ! error ) {
				setIsNavigating( true );
			}
		},
		[ createAccount, setIsNavigating ]
	);

	// If the user clicks "Back", rollback settings to restore saved values, if any.
	const { rollbackSettings } = useDispatch( STORE_NAME );
	const handleBack = useCallback( () => rollbackSettings() );

	if ( isDoingCreateAccount || isNavigating ) {
		return <ProgressBar />;
	}

	return (
		<div>
			<ErrorNotice />

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
				{ __( 'You will be redirected to Google Analytics to accept the Terms of Service and create your new account.', 'google-site-kit' ) }
			</p>

			<div className="googlesitekit-setup-module__action">
				<Button
					disabled={ ! canSubmitAccountCreate }
					onClick={ handleSubmit }
				>
					{ __( 'Create Account', 'google-site-kit' ) }
				</Button>

				<Link
					className="googlesitekit-setup-module__sub-action"
					onClick={ handleBack }
				>
					{ __( 'Back', 'google-site-kit' ) }
				</Link>
			</div>
		</div>
	);
}
