/**
 * AdSense SetupAccount component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import {
	MODULES_ADSENSE,
	API_STATE_NEEDS_ATTENTION,
	API_STATE_REQUIRES_REVIEW,
	API_STATE_GETTING_READY,
} from '../../datastore/constants';
import {
	ACCOUNT_STATUS_NO_CLIENT,
	ACCOUNT_STATUS_NEEDS_ATTENTION,
	ACCOUNT_STATUS_READY,
	ACCOUNT_STATUS_CLIENT_GETTING_READY,
	ACCOUNT_STATUS_CLIENT_REQUIRES_REVIEW,
	SITE_STATUS_NONE,
} from '../../util/status';
import SetupAccountSite from './SetupAccountSite';
import SetupAccountNoClient from './SetupAccountNoClient';
import SetupAccountCreateSite from './SetupAccountCreateSite';
import SetupAccountPendingTasks from './SetupAccountPendingTasks';
const { useSelect, useDispatch } = Data;

export default function SetupAccount( { account, finishSetup } ) {
	const { _id: accountID, state: accountState } = account;

	const clientID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getClientID()
	);

	const site = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getCurrentSite( accountID )
	);

	const afcClient = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAFCClient( accountID )
	);

	const { setClientID, setAccountStatus, setSiteStatus } =
		useDispatch( MODULES_ADSENSE );

	useEffect( () => {
		if ( afcClient?._id && clientID !== afcClient._id ) {
			setClientID( afcClient._id );
		} else if ( afcClient === null && !! clientID ) {
			setClientID( '' );
		}
	}, [ afcClient, clientID, setClientID ] );

	useEffect( () => {
		if ( site === null ) {
			setSiteStatus( SITE_STATUS_NONE );
		}
	}, [ setSiteStatus, site ] );

	useEffect( () => {
		// Do nothing if site isn't loaded yet.
		if ( site === undefined ) {
			return;
		}

		if ( ! clientID ) {
			setAccountStatus( ACCOUNT_STATUS_NO_CLIENT );
		} else if ( accountState === API_STATE_NEEDS_ATTENTION ) {
			setAccountStatus( ACCOUNT_STATUS_NEEDS_ATTENTION );
		} else if ( afcClient?.state === API_STATE_REQUIRES_REVIEW ) {
			setAccountStatus( ACCOUNT_STATUS_CLIENT_REQUIRES_REVIEW );
		} else if ( afcClient?.state === API_STATE_GETTING_READY ) {
			setAccountStatus( ACCOUNT_STATUS_CLIENT_GETTING_READY );
		} else {
			setAccountStatus( ACCOUNT_STATUS_READY );
		}
	}, [ accountState, afcClient, clientID, setAccountStatus, site ] );

	// Show the progress bar if site isn't loaded yet.
	if ( site === undefined ) {
		return <ProgressBar />;
	}

	if ( ! clientID ) {
		return <SetupAccountNoClient />;
	}

	if ( site === null ) {
		return <SetupAccountCreateSite />;
	}

	if (
		accountState === API_STATE_NEEDS_ATTENTION ||
		afcClient?.state === API_STATE_REQUIRES_REVIEW ||
		afcClient?.state === API_STATE_GETTING_READY
	) {
		return <SetupAccountPendingTasks />;
	}

	return <SetupAccountSite site={ site } finishSetup={ finishSetup } />;
}

SetupAccount.propTypes = {
	account: PropTypes.shape( {
		_id: PropTypes.string,
		state: PropTypes.string,
	} ),
	finishSetup: PropTypes.func,
};
