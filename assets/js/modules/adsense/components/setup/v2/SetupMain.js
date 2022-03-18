/**
 * AdSense Main setup component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { useUpdateEffect } from 'react-use';

/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ProgressBar from '../../../../../components/ProgressBar';
import AdSenseIcon from '../../../../../../svg/graphics/adsense.svg';
import SetupAccount from './SetupAccount';
import SetupCreateAccount from './SetupCreateAccount';
import SetupSelectAccount from './SetupSelectAccount';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { AdBlockerWarning } from '../../common';
import { MODULES_ADSENSE } from '../../../datastore/constants';
import {
	determineAccountID,
	determineAccountStatus,
	determineClientID,
	determineSiteStatus,
} from '../../../util/status';
const { useSelect, useDispatch } = Data;

export default function SetupMain() {
	const { setAccountID, submitChanges } = useDispatch( MODULES_ADSENSE );

	const [
		isAwaitingBackgroundSubmit,
		setIsAwaitingBackgroundSubmit,
	] = useState( false );
	// Submit changes for determined parameters in the background when they are valid.
	const [ isSubmittingInBackground, setIsSubmittingInBackground ] = useState(
		false
	);

	const siteURL = useSelect( ( select ) =>
		select( CORE_SITE ).getReferenceSiteURL()
	);
	const isAdBlockerActive = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).isAdBlockerActive()
	);
	const accounts = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccounts()
	);
	const previousAccountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);
	const previousClientID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getClientID()
	);
	const accountsError = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getError( 'getAccounts', [] )
	);
	// Check whether settings differ from server and are valid.
	const canSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).canSubmitChanges()
	);

	const accountID = determineAccountID( {
		accounts,
		previousAccountID,
	} );

	const clients = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getClients( accountID )
	);
	const alerts = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAlerts( accountID )
	);
	const alertsError = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getError( 'getAlerts', [ accountID ] )
	);

	const clientID = determineClientID( {
		clients,
		previousClientID,
	} );
	const urlChannels = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getURLChannels( accountID, clientID )
	);
	const urlChannelsError = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getErrorForSelector( 'getURLChannels', [
			accountID,
			clientID,
		] )
	);

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

	useUpdateEffect( () => {
		if (
			accountID !== undefined ||
			clientID !== undefined ||
			accountStatus !== undefined ||
			siteStatus !== undefined
		) {
			setIsAwaitingBackgroundSubmit( true );
		}
	}, [ accountID, clientID, accountStatus, siteStatus ] );

	useEffect( () => {
		if ( accounts?.length === 1 && ! accountID ) {
		}
	}, [ accounts, accountID ] );

	// Update current account ID setting on-the-fly.
	useEffect( () => {
		if ( accounts?.length === 1 && ! accountID ) {
			setAccountID( accountID );
			// Set flag to await background submission.
			setIsAwaitingBackgroundSubmit( true );
		}
	}, [ accounts, accountID, setAccountID ] );

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

	if ( accounts === undefined ) {
		return <ProgressBar />;
	}

	let viewComponent;
	if ( ! accounts.length ) {
		viewComponent = <SetupCreateAccount />;
	} else if ( ! accountID ) {
		viewComponent = <SetupSelectAccount />;
	} else {
		viewComponent = <SetupAccount account={ { _id: accountID } } />;
	}

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
