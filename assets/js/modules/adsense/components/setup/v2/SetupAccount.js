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
import {
	MODULES_ADSENSE,
	STATE_NEEDS_ATTENTION,
	STATE_REQUIRES_REVIEW,
	STATE_GETTING_READY,
} from '../../../datastore/constants';
import {
	ACCOUNT_STATUS_NO_CLIENT,
	ACCOUNT_STATUS_NEEDS_ATTENTION,
	ACCOUNT_STATUS_READY,
	ACCOUNT_STATUS_CLIENT_GETTING_READY,
	ACCOUNT_STATUS_CLIENT_REQUIRES_REVIEW,
	determineClientID,
} from '../../../util/status';
import ProgressBar from '../../../../../components/ProgressBar';
import SetupAccountSite from './SetupAccountSite';
import SetupAccountNoClient from './SetupAccountNoClient';
import SetupAccountCreateSite from './SetupAccountCreateSite';
import SetupAccountPendingTasks from './SetupAccountPendingTasks';
const { useSelect, useDispatch } = Data;

export default function SetupAccount( { account } ) {
	const { _id: accountID, state: accountState } = account;

	const clientID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getClientID()
	);

	const clients = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getClients( accountID )
	);

	const site = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getCurrentSite( accountID )
	);

	const acfClientID = determineClientID( { clients: clients || [] } );

	const { setClientID, setAccountStatus } = useDispatch( MODULES_ADSENSE );

	useEffect( () => {
		if ( acfClientID && ( ! clientID || clientID !== acfClientID ) ) {
			setClientID( acfClientID );
		}
	}, [ setClientID, clientID, acfClientID ] );

	useEffect( () => {
		// Do nothing if clients aren't loaded because we can't determine acfClientID yet.
		if ( clients === undefined || site === undefined ) {
			return;
		}

		if ( ! acfClientID ) {
			setAccountStatus( ACCOUNT_STATUS_NO_CLIENT );
		} else if ( accountState === STATE_NEEDS_ATTENTION ) {
			setAccountStatus( ACCOUNT_STATUS_NEEDS_ATTENTION );
		} else if ( site?.state === STATE_REQUIRES_REVIEW ) {
			setAccountStatus( ACCOUNT_STATUS_CLIENT_REQUIRES_REVIEW );
		} else if ( site?.state === STATE_GETTING_READY ) {
			setAccountStatus( ACCOUNT_STATUS_CLIENT_GETTING_READY );
		} else {
			setAccountStatus( ACCOUNT_STATUS_READY );
		}
	}, [ clients, setAccountStatus, acfClientID, site, accountState ] );

	// Show the progress bar if clients or site aren't loaded yet.
	if ( clients === undefined || site === undefined ) {
		return <ProgressBar />;
	}

	if ( ! acfClientID ) {
		return <SetupAccountNoClient accountID={ accountID } />;
	}

	if ( site === null ) {
		return <SetupAccountCreateSite accountID={ accountID } />;
	}

	if ( accountState === STATE_NEEDS_ATTENTION ) {
		return <SetupAccountPendingTasks accountID={ accountID } />;
	}

	return <SetupAccountSite site={ site } />;
}

SetupAccount.propTypes = {
	account: PropTypes.shape( {
		_id: PropTypes.string,
		state: PropTypes.string,
	} ),
};
