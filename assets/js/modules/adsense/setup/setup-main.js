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
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ProgressBar from '../../../components/progress-bar';
import ErrorText from '../../../components/error-text';
import { SvgIcon } from '../../../util';
import { STORE_NAME } from '../datastore/constants';
import { STORE_NAME as siteStoreName } from '../../../googlesitekit/datastore/site/constants';
import {
	ACCOUNT_STATUS_NONE,
	ACCOUNT_STATUS_MULTIPLE,
	ACCOUNT_STATUS_DISAPPROVED,
	ACCOUNT_STATUS_GRAYLISTED,
	ACCOUNT_STATUS_PENDING,
	ACCOUNT_STATUS_NO_CLIENT,
	ACCOUNT_STATUS_APPROVED,
	SITE_STATUS_NONE,
	SITE_STATUS_ADDED,
	determineAccountID,
	determineClientID,
	determineAccountStatus,
	determineSiteStatus,
} from '../util/status';
import SetupAccountCreate from './setup-account-create';
import SetupAccountSelect from './setup-account-select';
import SetupAccountDisapproved from './setup-account-disapproved';
import SetupAccountPending from './setup-account-pending';
import SetupAccountNoClient from './setup-account-no-client';
import SetupAccountApproved from './setup-account-approved';
import SetupSiteAdd from './setup-site-add';
import SetupSiteAdded from './setup-site-added';
import {
	AdBlockerWarning,
} from '../common';
const { useSelect, useDispatch } = Data;

export default function SetupMain() {
	// Get settings.
	const siteURL = useSelect( ( select ) => select( siteStoreName ).getReferenceSiteURL() );
	const previousAccountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const previousClientID = useSelect( ( select ) => select( STORE_NAME ).getClientID() );
	const previousAccountStatus = useSelect( ( select ) => select( STORE_NAME ).getAccountStatus() );
	const previousSiteStatus = useSelect( ( select ) => select( STORE_NAME ).getSiteStatus() );
	const accountSetupComplete = useSelect( ( select ) => select( STORE_NAME ).getAccountSetupComplete() );
	const siteSetupComplete = useSelect( ( select ) => select( STORE_NAME ).getSiteSetupComplete() );

	// Check whether settings differ from server and are valid.
	const canSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).canSubmitChanges() );

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
		setUseSnippet,
		submitChanges,
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
		// Don't do anything if account status cannot be determined (because of arguments not loaded yet).
		if ( 'undefined' === typeof accountStatus ) {
			return;
		}
		// Force setup completion flags to false in case it had been set before.
		if ( accountStatus !== ACCOUNT_STATUS_APPROVED ) {
			setAccountSetupComplete( false );
			setSiteSetupComplete( false );
		}
		// Force snippet placement to true when account is graylisted or pending.
		if ( accountStatus === ACCOUNT_STATUS_GRAYLISTED || accountStatus === ACCOUNT_STATUS_PENDING ) {
			setUseSnippet( true );
		}
		setAccountStatus( accountStatus );
	}, [ accountStatus ] );

	// Update site status setting on-the-fly.
	useEffect( () => {
		// Don't do anything if site status cannot be determined (because of arguments not loaded yet).
		if ( 'undefined' === typeof siteStatus ) {
			return;
		}
		// Force site setup completion flag to false in case it had been set before.
		if ( siteStatus !== SITE_STATUS_ADDED ) {
			setSiteSetupComplete( false );
		}
		setSiteStatus( siteStatus );
	}, [ siteStatus ] );

	// Submit changes for determined parameters in the background when they are valid.
	useEffect( () => {
		// Only submit changes if valid (plus temporary hack to avoid saving in Storybook).
		if ( ! canSubmitChanges || global.__STORYBOOK_ADDONS ) {
			return;
		}
		submitChanges();
	}, [ previousAccountID, previousClientID, previousAccountStatus, previousSiteStatus ] );

	const isAdBlockerActive = useSelect( ( select ) => select( STORE_NAME ).isAdBlockerActive() );

	let viewComponent;
	if ( 'undefined' === typeof accountStatus ) {
		// Show loading indicator if account status not determined yet.
		viewComponent = <ProgressBar />;
	} else if ( accountStatus !== ACCOUNT_STATUS_APPROVED || ! accountSetupComplete ) {
		// Show relevant account status component.
		switch ( accountStatus ) {
			case ACCOUNT_STATUS_NONE:
				viewComponent = <SetupAccountCreate />;
				break;
			case ACCOUNT_STATUS_MULTIPLE:
				viewComponent = <SetupAccountSelect />;
				break;
			case ACCOUNT_STATUS_DISAPPROVED:
				viewComponent = <SetupAccountDisapproved />;
				break;
			case ACCOUNT_STATUS_GRAYLISTED:
			case ACCOUNT_STATUS_PENDING:
				viewComponent = <SetupAccountPending />;
				break;
			case ACCOUNT_STATUS_NO_CLIENT:
				viewComponent = <SetupAccountNoClient />;
				break;
			case ACCOUNT_STATUS_APPROVED:
				viewComponent = <SetupAccountApproved />;
				break;
			default:
				viewComponent = <ErrorText message={ sprintf(
					/* translators: %s: invalid account status identifier */
					__( 'Invalid account status: %s', 'google-site-kit' ),
					accountStatus
				) } />;
		}
	} else if ( 'undefined' === typeof siteStatus ) {
		// Show loading indicator if site status not determined yet.
		viewComponent = <ProgressBar />;
	} else if ( siteStatus !== SITE_STATUS_ADDED || ! siteSetupComplete ) {
		// Show relevant site status component.
		switch ( siteStatus ) {
			case SITE_STATUS_NONE:
				viewComponent = <SetupSiteAdd />;
				break;
			case SITE_STATUS_ADDED:
				viewComponent = <SetupSiteAdded />;
				break;
			default:
				viewComponent = <ErrorText message={ sprintf(
					/* translators: %s: invalid site status identifier */
					__( 'Invalid site status: %s', 'google-site-kit' ),
					siteStatus
				) } />;
		}
	} else {
		// This should never be reached because the setup is not accessible
		// under these circumstances due to related PHP+/JS logic. But at
		// least in theory it should show the last step, just in case.
		viewComponent = <SetupSiteAdded />;
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
