/**
 * Status utlities.
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

export const ACCOUNT_STATUS_NONE = 'none';
export const ACCOUNT_STATUS_DISAPPROVED = 'disapproved';
export const ACCOUNT_STATUS_GRAYLISTED = 'graylisted';
export const ACCOUNT_STATUS_MULTIPLE = 'multiple';
export const ACCOUNT_STATUS_NO_CLIENT = 'no-client';
export const ACCOUNT_STATUS_PENDING = 'pending';
export const ACCOUNT_STATUS_APPROVED = 'approved';

// TODO: If AdSense API exposes more information, site status can be determined
// much more accurately than the two statuses below. See also function docs.
export const SITE_STATUS_NONE = 'none';
export const SITE_STATUS_ADDED = 'added';

/**
 * Determines the AdSense account status for given input data.
 *
 * This utility function should be used in combination with data retrieved from
 * the datastore, hence passing undefined (loading state) is supported.
 *
 * @since n.e.x.t
 *
 * @param {Object}  data               Input data to determine account status.
 * @param {?Array}  data.accounts      List of account objects retrieved from the API.
 * @param {?Array}  data.clients       List of client objects retrieved from the API.
 * @param {?Array}  data.alerts        List of alert objects retrieved from the API.
 * @param {?Object} data.error         Error object if one of the API requests failed.
 * @param {?string} data.prevAccountID Account ID, if already known from before.
 * @param {?string} data.prevClientID  Client ID, if already known from before.
 * @return {?string} Account status determined, or undefined if one of the required
 *                   parameters is undefined.
 */
export const determineAccountStatus = ( {
	accounts,
	clients,
	alerts,
	error,
	prevAccountID,
	prevClientID,
} ) => {
	if ( 'undefined' === typeof accounts || 'undefined' === typeof prevAccountID ) {
		return errorToStatus( error );
	}

	const accountID = determineAccountID( { accounts, prevAccountID } );
	if ( ! accountID ) {
		// If there are accounts, but the account ID cannot be determined, it
		// means that there are multiple accounts and the user needs to select
		// one.
		if ( accounts.length ) {
			return ACCOUNT_STATUS_MULTIPLE;
		}
		return ACCOUNT_STATUS_NONE;
	}

	if ( 'undefined' === typeof alerts ) {
		return errorToStatus( error );
	}

	const hasGraylistedAlert = !! alerts.filter( ( alert ) => {
		return 'GRAYLISTED_PUBLISHER' === alert.type;
	} ).length;
	if ( hasGraylistedAlert ) {
		return ACCOUNT_STATUS_GRAYLISTED;
	}

	if ( 'undefined' === typeof clients || 'undefined' === typeof prevClientID ) {
		return errorToStatus( error );
	}

	const clientID = determineClientID( { clients, prevClientID } );
	if ( ! clientID ) {
		return ACCOUNT_STATUS_NO_CLIENT;
	}

	return ACCOUNT_STATUS_APPROVED;
};

/**
 * Determines the AdSense site status for given input data.
 *
 * This utility function should be used in combination with data retrieved from
 * the datastore, hence passing undefined (loading state) is supported.
 *
 * The AdSense API currently only surfaces limited information about the approval
 * status for a site, so at this point it is only possible to know whether the
 * site has been added or not. In other words, the site being added does not
 * necessarily mean it has been already approved - there still may be actions
 * required for the user.
 *
 * @since n.e.x.t
 *
 * @param {Object}  data             Input data to determine site status.
 * @param {?Array}  data.urlChannels List of URL channel objects retrieved from the API.
 * @param {?string} data.siteURL     URL of this website.
 * @return {?string} Site status determined, or undefined if one of the required
 *                   parameters is undefined.
 */
export const determineSiteStatus = ( {
	urlChannels,
	siteURL,
} ) => {
	if ( 'undefined' === typeof urlChannels || 'undefined' === typeof siteURL ) {
		return undefined;
	}

	const hasSiteURL = !! urlChannels.filter( ( urlChannel ) => {
		return 0 <= siteURL.indexOf( urlChannel.urlPattern );
	} ).length;
	if ( ! hasSiteURL ) {
		return SITE_STATUS_NONE;
	}

	return SITE_STATUS_ADDED;
};

/**
 * Determines the AdSense account ID for given input data.
 *
 * @since n.e.x.t
 *
 * @param {Object}  data               Input data to determine account ID.
 * @param {?Array}  data.accounts      List of account objects retrieved from the API.
 * @param {?string} data.prevAccountID Account ID, if already known from before.
 * @return {?string} Account ID, empty string if no account ID could be determined,
 *                   or undefined if one of the required parameters is undefined.
 */
export const determineAccountID = ( { accounts, prevAccountID } ) => {
	// If loading, nothing to determine.
	if ( 'undefined' === typeof accounts ) {
		return undefined;
	}

	// If no accounts, the user needs to create one.
	if ( ! accounts.length ) {
		return '';
	}

	// If there are multiple accounts (very rare), we'll need the account ID.
	if ( accounts.length > 1 ) {
		// If no ID passed, the user will need to select an account first.
		if ( ! prevAccountID ) {
			return '';
		}

		// Ensure the passed account ID is actually available.
		return accounts.reduce( ( acc, account ) => {
			if ( account.id === prevAccountID ) {
				return prevAccountID;
			}
			return acc;
		}, '' );
	}

	// Choose the only account that the user has.
	return accounts[ 0 ].id;
};

/**
 * Determines the AdSense client ID for given input data.
 *
 * @since n.e.x.t
 *
 * @param {Object}  data              Input data to determine client ID.
 * @param {?Array}  data.clients      List of client objects retrieved from the API.
 * @param {?string} data.prevClientID Client ID, if already known from before.
 * @return {?string} Client ID, empty string if no client ID could be determined,
 *                   or undefined if one of the required parameters is undefined.
 */
export const determineClientID = ( { clients, prevClientID } ) => {
	// If loading, nothing to determine.
	if ( 'undefined' === typeof clients ) {
		return undefined;
	}

	// Only AFC (AdSense For Content) clients matter for Site Kit.
	const afcClients = clients.filter( ( client ) => {
		return 'AFC' === client.productCode;
	} );

	// If no AFC clients, the user needs to create one.
	if ( ! afcClients.length ) {
		return '';
	}

	// If multiple AFC clients and client ID was already known, try looking it up.
	if ( afcClients.length > 1 && prevClientID ) {
		const clientID = afcClients.reduce( ( acc, client ) => {
			if ( client.id === prevClientID ) {
				return prevClientID;
			}
			return acc;
		}, '' );
		if ( clientID ) {
			return clientID;
		}
	}

	// Otherwise, just pick the first AFC client. There should only ever be one anyway.
	return afcClients[ 0 ].id;
};

/**
 * Transforms an AdSense API error to the appropriate status.
 *
 * @since n.e.x.t
 * @access private
 *
 * @param {?Object} error Error object or undefined.
 * @return {?string} Status based on error, or undefined if no relevant error.
 */
const errorToStatus = ( error ) => {
	if ( ! error ) {
		return undefined;
	}

	// These specific errors represent account statuses for our purposes.
	if ( 'noAdSenseAccount' === error.data.reason ) {
		return ACCOUNT_STATUS_NONE;
	}
	if ( 'disapprovedAccount' === error.data.reason ) {
		return ACCOUNT_STATUS_DISAPPROVED;
	}
	if ( 'accountPendingReview' === error.data.reason ) {
		return ACCOUNT_STATUS_PENDING;
	}

	return undefined;
};
