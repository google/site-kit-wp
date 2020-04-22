/**
 * AdSense Main setup component.
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
import { useEffect } from '@wordpress/element';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ProgressBar from '../../../components/progress-bar';
import { SvgIcon } from '../../../util';
import { STORE_NAME } from '../datastore/constants';
import { STORE_NAME as siteStoreName } from '../../../googlesitekit/datastore/site/constants';
import {
	ACCOUNT_STATUS_APPROVED,
	SITE_STATUS_ADDED,
	determineAccountID,
	determineClientID,
	determineAccountStatus,
	determineSiteStatus,
} from '../util/status';
import {
	AdBlockerWarning,
} from '../common';
const { useSelect, useDispatch } = Data;

export default function SetupMain() {
	// Get settings.
	const siteURL = useSelect( ( select ) => select( siteStoreName ).getReferenceSiteURL() );
	const previousAccountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const previousClientID = useSelect( ( select ) => select( STORE_NAME ).getClientID() );
	const accountSetupComplete = useSelect( ( select ) => select( STORE_NAME ).getAccountSetupComplete() );
	const siteSetupComplete = useSelect( ( select ) => select( STORE_NAME ).getSiteSetupComplete() );

	// Determine account.
	const accounts = useSelect( ( select ) => select( STORE_NAME ).getAccounts() );
	const accountID = determineAccountID( {
		accounts,
		previousAccountID,
	} );

	// Determine client.
	const clients = useSelect( ( select ) => select( STORE_NAME ).getClients( accountID ) );
	const clientID = determineClientID( {
		clients,
		previousClientID,
	} );

	// Get additional information to determine account and site status.
	const alerts = useSelect( ( select ) => select( STORE_NAME ).getAlerts( accountID ) );
	const urlChannels = useSelect( ( select ) => select( STORE_NAME ).getURLChannels( clientID ) );
	const error = useSelect( ( select ) => select( STORE_NAME ).getError() );

	// Determine account and site status.
	const accountStatus = determineAccountStatus( {
		accounts,
		clients,
		alerts,
		error,
		previousAccountID,
		previousClientID,
	} );
	const siteStatus = determineSiteStatus( {
		urlChannels,
		siteURL,
	} );

	const {
		setAccountID,
		setClientID,
		setAccountStatus,
		setSiteStatus,
		setAccountSetupComplete,
		setSiteSetupComplete,
	} = useDispatch( STORE_NAME );

	// Update current account ID setting on-the-fly.
	useEffect( () => {
		// Don't do anything if setting has not loaded yet or if account ID cannot be determined.
		if ( 'undefined' === typeof previousAccountID || 'undefined' === typeof accountID ) {
			return;
		}
		setAccountID( accountID );
	}, [ previousAccountID, accountID ] );

	// Update current client ID setting on-the-fly.
	useEffect( () => {
		// Don't do anything if setting has not loaded yet or if client ID cannot be determined.
		if ( 'undefined' === typeof previousClientID || 'undefined' === typeof clientID ) {
			return;
		}
		setClientID( clientID );
	}, [ previousClientID, clientID ] );

	// Update account status setting on-the-fly.
	useEffect( () => {
		// Don't do anything if account status cannot be determined (because of parts .
		if ( 'undefined' === typeof accountStatus ) {
			return;
		}
		setAccountStatus( accountStatus );
		// Force setup completion flag to false in case it had been set before.
		if ( accountStatus !== ACCOUNT_STATUS_APPROVED ) {
			setAccountSetupComplete( false );
		}
	}, [ accountStatus ] );

	// Update site status setting on-the-fly.
	useEffect( () => {
		// Don't do anything if site status cannot be determined (because of parts .
		if ( 'undefined' === typeof siteStatus ) {
			return;
		}
		setSiteStatus( siteStatus );
		// Force setup completion flag to false in case it had been set before.
		if ( siteStatus !== SITE_STATUS_ADDED ) {
			setSiteSetupComplete( false );
		}
	}, [ siteStatus ] );

	const isAdBlockerActive = useSelect( ( select ) => select( STORE_NAME ).isAdBlockerActive() );
	const isLoading = 'undefined' === typeof accountStatus || 'undefined' === typeof siteStatus;

	let viewComponent;
	if ( isLoading ) {
		viewComponent = <ProgressBar />;
	} else {
		viewComponent = <div>{ accountStatus } / { siteStatus }</div>;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--adsense">
			<div className="googlesitekit-setup-module__step">
				<div className="googlesitekit-setup-module__logo">
					<SvgIcon id="adsense" width="33" height="33" />
				</div>

				<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
					{ _x( 'AdSense', 'Service name', 'google-site-kit' ) }
				</h2>
			</div>

			<div className="googlesitekit-setup-module__step">
				{ ( ! accountSetupComplete || ! siteSetupComplete ) && (
					<AdBlockerWarning />
				) }

				{ ! isAdBlockerActive && (
					viewComponent
				) }
			</div>
		</div>
	);
}
