/**
 * AdSense Main setup component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { useEffect, useState } from '@wordpress/element';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import AdSenseIcon from '../../../../../svg/graphics/adsense.svg';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import {
	ACCOUNT_STATUS_APPROVED,
	SITE_STATUS_ADDED,
	determineAccountID,
	determineClientID,
	determineAccountStatus,
	determineSiteStatus,
} from '../../util/status';
import { getSetupMainViewComponent } from './utils';
import { trackEvent } from '../../../../util';
import { AdBlockerWarning } from '../common';
import useViewContext from '../../../../hooks/useViewContext';
const { useSelect, useDispatch } = Data;

export default function SetupMain( { finishSetup } ) {
	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_adsense`;

	// Get settings.
	const siteURL = useSelect( ( select ) =>
		select( CORE_SITE ).getReferenceSiteURL()
	);
	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigating()
	);
	const previousAccountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);
	const previousClientID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getClientID()
	);
	const previousAccountStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountStatus()
	);
	const previousSiteStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getSiteStatus()
	);
	const accountSetupComplete = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountSetupComplete()
	);
	const siteSetupComplete = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getSiteSetupComplete()
	);

	// Check whether a change submission is in progress.
	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).isDoingSubmitChanges()
	);

	// Check whether settings differ from server and are valid.
	const canSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).canSubmitChanges()
	);

	// Determine account.
	const accounts = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccounts()
	);
	const accountID = determineAccountID( {
		accounts,
		previousAccountID,
	} );

	// Determine client.
	const clients = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getClients( accountID )
	);
	const clientID = determineClientID( {
		clients,
		previousClientID,
	} );

	// Get additional information to determine account and site status.
	const alerts = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAlerts( accountID )
	);
	const urlChannels = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getURLChannels( accountID, clientID )
	);
	const urlChannelsError = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getErrorForSelector( 'getURLChannels', [
			accountID,
			clientID,
		] )
	);
	const accountsError = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getError( 'getAccounts', [] )
	);
	const alertsError = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getError( 'getAlerts', [ accountID ] )
	);
	const hasErrors = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).hasErrors()
	);

	// Determine account and site status.
	const accountStatus = determineAccountStatus( {
		accounts,
		clients,
		alerts,
		urlChannels,
		accountsError,
		alertsError,
		urlChannelsError,
		previousAccountID,
		previousClientID,
	} );
	const siteStatus = determineSiteStatus( {
		urlChannels,
		siteURL,
	} );

	const {
		clearError,
		setAccountID,
		setClientID,
		setAccountStatus,
		setSiteStatus,
		setAccountSetupComplete,
		setSiteSetupComplete,
		setUseSnippet,
		submitChanges,
		resetAccounts,
		resetAlerts,
		resetClients,
		resetURLChannels,
	} = useDispatch( MODULES_ADSENSE );

	// Allow flagging when a background submission should happen.
	const [ isAwaitingBackgroundSubmit, setIsAwaitingBackgroundSubmit ] =
		useState( false );

	// Update current account ID setting on-the-fly.
	useEffect( () => {
		// Don't do anything if setting has not loaded yet, if account ID
		// cannot be determined, or if nothing has changed.
		if (
			undefined === previousAccountID ||
			undefined === accountID ||
			previousAccountID === accountID
		) {
			return;
		}
		setAccountID( accountID );
		// Set flag to await background submission.
		setIsAwaitingBackgroundSubmit( true );
	}, [ previousAccountID, accountID, setAccountID ] );

	// Update current client ID setting on-the-fly.
	useEffect( () => {
		// Don't do anything if setting has not loaded yet, if client ID cannot
		// be determined, or if nothing has changed.
		if (
			undefined === previousClientID ||
			undefined === clientID ||
			previousClientID === clientID
		) {
			return;
		}
		setClientID( clientID );
		// Set flag to await background submission.
		setIsAwaitingBackgroundSubmit( true );
	}, [ previousClientID, clientID, setClientID ] );

	// Update account status setting on-the-fly.
	useEffect( () => {
		// Don't do anything if setting has not loaded yet, if account status
		// cannot be determined, or if nothing has changed.
		if (
			undefined === previousAccountStatus ||
			undefined === accountStatus ||
			previousAccountStatus === accountStatus
		) {
			return;
		}
		// Force setup completion flags to false in case it had been set
		// before, and enforce snippet placement until the account is
		// approved.
		if ( accountStatus !== ACCOUNT_STATUS_APPROVED ) {
			setAccountSetupComplete( false );
			setSiteSetupComplete( false );
			setUseSnippet( true );
		}
		setAccountStatus( accountStatus );
		// Set flag to await background submission.
		setIsAwaitingBackgroundSubmit( true );
	}, [
		previousAccountStatus,
		accountStatus,
		setAccountSetupComplete,
		setSiteSetupComplete,
		setUseSnippet,
		setAccountStatus,
	] );

	// Update site status setting on-the-fly.
	useEffect( () => {
		// Don't do anything if setting has not loaded yet, if site status
		// cannot be determined, or if nothing has changed.
		if (
			undefined === previousSiteStatus ||
			undefined === siteStatus ||
			previousSiteStatus === siteStatus
		) {
			return;
		}
		// Force site setup completion flag to false in case it had been set before.
		if ( siteStatus !== SITE_STATUS_ADDED ) {
			setSiteSetupComplete( false );
		}
		setSiteStatus( siteStatus );
		// Set flag to await background submission.
		setIsAwaitingBackgroundSubmit( true );
	}, [
		previousSiteStatus,
		siteStatus,
		setSiteSetupComplete,
		setSiteStatus,
	] );

	// Submit changes for determined parameters in the background when they are valid.
	const [ isSubmittingInBackground, setIsSubmittingInBackground ] =
		useState( false );
	// If a background submission should happen and changes are valid to be
	// submitted, do that here. This is wrapped in a separate useEffect hook
	// and relies on isAwaitingBackgroundSubmit since the above useEffect hook
	// must not depend on canSubmitChanges, since that is also updated when
	// other than the above four settings are updated.
	useEffect( () => {
		if (
			! isAwaitingBackgroundSubmit ||
			isSubmittingInBackground ||
			! canSubmitChanges
		) {
			return;
		}

		// Set flag to false since we are gonna run the background submission
		// right now.
		setIsAwaitingBackgroundSubmit( false );

		// Set internal state for submitting in background to avoid sudden
		// rendering of a progress bar.
		( async () => {
			setIsSubmittingInBackground( true );
			await submitChanges();
			setIsSubmittingInBackground( false );
		} )();
	}, [
		isAwaitingBackgroundSubmit,
		isSubmittingInBackground,
		canSubmitChanges,
		submitChanges,
	] );

	const isAdBlockerActive = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).isAdBlockerActive()
	);

	// Reset all fetched data when user re-focuses tab.
	useEffect( () => {
		let timeout;
		let idleSeconds = 0;
		// Count seconds once user focuses elsewhere.
		const countIdleTime = () => {
			timeout = global.setInterval( () => {
				idleSeconds++;
			}, 1000 );
		};
		// Reset when user re-focuses after 15 seconds or more.
		const reset = () => {
			global.clearTimeout( timeout );
			// Do not reset if user has been away for less than 15 seconds.
			if ( idleSeconds < 15 ) {
				idleSeconds = 0;
				return;
			}
			idleSeconds = 0;
			// Do not reset if account status has not been determined yet, or
			// if the account is approved.
			if (
				undefined === accountStatus ||
				ACCOUNT_STATUS_APPROVED === accountStatus
			) {
				return;
			}

			// Unset any potential error.
			clearError();
			// Reset all data to force re-fetch.
			resetAccounts();
			resetAlerts();
			resetClients();
			resetURLChannels();
		};
		global.addEventListener( 'focus', reset );
		global.addEventListener( 'blur', countIdleTime );
		return () => {
			global.removeEventListener( 'focus', reset );
			global.removeEventListener( 'blur', countIdleTime );
			global.clearTimeout( timeout );
		};
	}, [
		accountStatus,
		clearError,
		resetAccounts,
		resetAlerts,
		resetClients,
		resetURLChannels,
	] );

	// Fetch existing tag right here, to ensure the progress bar is still being
	// shown while this is being loaded. It is technically used only by child
	// components.
	const existingTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getExistingTag()
	);

	useEffect( () => {
		if ( accountStatus !== undefined ) {
			trackEvent(
				eventCategory,
				'receive_account_status',
				accountStatus
			);
		}
	}, [ eventCategory, accountStatus ] );

	useEffect( () => {
		if ( siteStatus !== undefined ) {
			trackEvent( eventCategory, 'receive_site_status', siteStatus );
		}
	}, [ eventCategory, siteStatus ] );

	const viewComponent = getSetupMainViewComponent(
		accountStatus,
		hasErrors,
		existingTag,
		isDoingSubmitChanges,
		isSubmittingInBackground,
		isNavigating,
		accountSetupComplete,
		siteStatus,
		siteSetupComplete,
		finishSetup
	);

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--adsense">
			<div className="googlesitekit-setup-module__step">
				<div className="googlesitekit-setup-module__logo">
					<AdSenseIcon width="33" height="33" />
				</div>

				<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
					{ _x( 'AdSense', 'Service name', 'google-site-kit' ) }
				</h2>
			</div>

			<div className="googlesitekit-setup-module__step">
				<AdBlockerWarning />

				{ ! isAdBlockerActive && viewComponent }
			</div>
		</div>
	);
}

SetupMain.propTypes = {
	finishSetup: PropTypes.func,
};

SetupMain.defaultProps = {
	finishSetup: () => {},
};
