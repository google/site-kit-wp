/**
 * Status utlities.
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

// V1 setup flow.
export const ACCOUNT_STATUS_DISAPPROVED = 'disapproved';
export const ACCOUNT_STATUS_GRAYLISTED = 'graylisted';
export const ACCOUNT_STATUS_PENDING = 'pending';
export const ACCOUNT_STATUS_APPROVED = 'approved';

// V2 setup flow.
export const ACCOUNT_STATUS_NEEDS_ATTENTION = 'needs-attention';
export const ACCOUNT_STATUS_READY = 'ready';
export const ACCOUNT_STATUS_CLIENT_REQUIRES_REVIEW = 'client-requires-review';
export const ACCOUNT_STATUS_CLIENT_GETTING_READY = 'client-getting-ready';

// V1 and V2 setup flow.
export const ACCOUNT_STATUS_NONE = 'none';
export const ACCOUNT_STATUS_MULTIPLE = 'multiple';
export const ACCOUNT_STATUS_NO_CLIENT = 'no-client';

// V1 setup flow.
export const SITE_STATUS_ADDED = 'added';

// V2 setup flow.
export const SITE_STATUS_NEEDS_ATTENTION = 'needs-attention';
export const SITE_STATUS_REQUIRES_REVIEW = 'requires-review';
export const SITE_STATUS_GETTING_READY = 'getting-ready';
export const SITE_STATUS_READY = 'ready';
export const SITE_STATUS_READY_NO_AUTO_ADS = 'ready-no-auto-ads';

// V1 and V2 setup flow.
export const SITE_STATUS_NONE = 'none';

export const legacyAccountStatuses = [
	ACCOUNT_STATUS_DISAPPROVED,
	ACCOUNT_STATUS_GRAYLISTED,
	ACCOUNT_STATUS_PENDING,
	ACCOUNT_STATUS_APPROVED,
];

/**
 * Determines the AdSense account status for given input data.
 *
 * This utility function should be used in combination with data retrieved from
 * the datastore, hence passing undefined (loading state) is supported.
 *
 * @since 1.9.0
 *
 * @param {Object}             data                   Input data to determine account status.
 * @param {(Array|undefined)}  data.accounts          List of account objects retrieved from the API.
 * @param {(Array|undefined)}  data.clients           List of client objects retrieved from the API.
 * @param {(Array|undefined)}  data.alerts            List of alert objects retrieved from the API.
 * @param {(Array|undefined)}  data.urlChannels       List of URL channel objects retrieved from the API.
 * @param {(Object|undefined)} data.accountsError     Error object if account API request failed.
 * @param {(Object|undefined)} data.alertsError       Error object if alert API request failed.
 * @param {(Object|undefined)} data.urlChannelsError  Error object if URL Channel API request failed.
 * @param {(string|undefined)} data.previousAccountID Account ID, if already known from before.
 * @param {(string|undefined)} data.previousClientID  Client ID, if already known from before.
 * @return {(string|undefined)} Account status determined, or undefined if one of the required
 *                   parameters is undefined.
 */
export function determineAccountStatus( data ) {
	const {
		accounts,
		clients,
		alerts,
		urlChannels,
		accountsError,
		alertsError,
		urlChannelsError,
		previousAccountID,
		previousClientID,
	} = data;

	if ( undefined === accounts || undefined === previousAccountID ) {
		return accountsErrorToStatus( accountsError );
	}

	const accountID = determineAccountID( { accounts, previousAccountID } );
	if ( ! accountID ) {
		// If there are accounts, but the account ID cannot be determined, it
		// means that there are multiple accounts and the user needs to select
		// one.
		return accounts.length ? ACCOUNT_STATUS_MULTIPLE : ACCOUNT_STATUS_NONE;
	}

	// For any of the following statuses, it must be ensured that clients are loaded.
	if ( undefined === clients || undefined === previousClientID ) {
		return undefined;
	}

	if ( undefined === alerts ) {
		return alertsErrorToStatus( alertsError );
	}

	const hasGraylistedAlert = alerts.some(
		( alert ) => 'graylisted-publisher' === alert.type
	);
	if ( hasGraylistedAlert ) {
		return ACCOUNT_STATUS_GRAYLISTED;
	}

	const clientID = determineClientID( { clients, previousClientID } );
	if ( ! clientID ) {
		return ACCOUNT_STATUS_NO_CLIENT;
	}

	if ( undefined === urlChannels ) {
		return urlChannelsErrorToStatus( urlChannelsError );
	}

	return ACCOUNT_STATUS_APPROVED;
}

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
 * @since 1.9.0
 *
 * @param {Object}             data             Input data to determine site status.
 * @param {(Array|undefined)}  data.urlChannels List of URL channel objects retrieved from the API.
 * @param {(string|undefined)} data.siteURL     URL of this website.
 * @return {(string|undefined)} Site status determined, or undefined if one of the required
 *                   parameters is undefined.
 */
export const determineSiteStatus = ( { urlChannels, siteURL } ) => {
	if ( undefined === urlChannels || undefined === siteURL ) {
		return undefined;
	}

	const lowerSiteURL = siteURL.toLowerCase();
	const hasSiteURL = urlChannels.some( ( urlChannel ) => {
		return 0 <= lowerSiteURL.indexOf( urlChannel.uriPattern.toLowerCase() );
	} );
	if ( ! hasSiteURL ) {
		return SITE_STATUS_NONE;
	}

	return SITE_STATUS_ADDED;
};

/**
 * Determines the AdSense account ID for given input data.
 *
 * @since 1.9.0
 *
 * @param {Object}             data                   Input data to determine account ID.
 * @param {(Array|undefined)}  data.accounts          List of account objects retrieved from the API.
 * @param {(string|undefined)} data.previousAccountID Account ID, if already known from before.
 * @return {(string|undefined)} Account ID, empty string if no account ID could be determined,
 *                   or undefined if one of the required parameters is undefined.
 */
export const determineAccountID = ( { accounts, previousAccountID } ) => {
	// If loading, nothing to determine.
	if ( undefined === accounts ) {
		return undefined;
	}

	// If no accounts, the user needs to create one.
	if ( ! accounts.length ) {
		return undefined;
	}

	// If there are multiple accounts (very rare), we'll need the account ID.
	if ( accounts.length > 1 ) {
		// If no ID passed, the user will need to select an account first.
		if ( ! previousAccountID ) {
			return undefined;
		}

		// Ensure the passed account ID is actually available.
		return accounts.reduce( ( acc, account ) => {
			if ( account._id === previousAccountID ) {
				return previousAccountID;
			}
			return acc;
		}, undefined );
	}

	// Choose the only account that the user has.
	return accounts[ 0 ]._id;
};

/**
 * Determines the AdSense client ID for given input data.
 *
 * @since 1.9.0
 *
 * @param {Object}             data                  Input data to determine client ID.
 * @param {(Array|undefined)}  data.clients          List of client objects retrieved from the API.
 * @param {(string|undefined)} data.previousClientID Client ID, if already known from before.
 * @return {(string|undefined)} Client ID, empty string if no client ID could be determined,
 *                   or undefined if one of the required parameters is undefined.
 */
export const determineClientID = ( { clients, previousClientID } ) => {
	// If loading, nothing to determine.
	if ( undefined === clients ) {
		return undefined;
	}

	// Only AFC (AdSense For Content) clients matter for Site Kit.
	const afcClients = clients.filter( ( client ) => {
		return 'AFC' === client.productCode;
	} );

	// If no AFC clients, the user needs to create one.
	if ( ! afcClients.length ) {
		return undefined;
	}

	// If multiple AFC clients and client ID was already known, try looking it up.
	if ( afcClients.length > 1 && previousClientID ) {
		const clientID = afcClients.reduce( ( acc, client ) => {
			if ( client._id === previousClientID ) {
				return previousClientID;
			}
			return acc;
		}, '' );
		if ( clientID ) {
			return clientID;
		}
	}

	// Otherwise, just pick the first AFC client. There should only ever be one anyway.
	return afcClients[ 0 ]._id;
};

/**
 * Checks whether the given account status is considered pending.
 *
 * @since 1.9.0
 *
 * @param {(string|undefined)} accountStatus Account status.
 * @return {boolean} True if pending, false otherwise.
 */
export const isPendingAccountStatus = ( accountStatus ) => {
	return (
		accountStatus === ACCOUNT_STATUS_GRAYLISTED ||
		accountStatus === ACCOUNT_STATUS_PENDING
	);
};

/**
 * Transforms an AdSense API error to the appropriate status.
 *
 * @since 1.9.0
 *
 * @param {(Object|undefined)} error Error object or undefined.
 * @return {(string|undefined)} Status based on error, or undefined if no relevant error.
 */
export const errorToStatus = ( error ) => {
	return (
		accountsErrorToStatus( error ) ||
		alertsErrorToStatus( error ) ||
		urlChannelsErrorToStatus( error )
	);
};

const accountsErrorToStatus = ( error ) => {
	// These specific errors represent account statuses for our purposes.
	// They can be returned from the 'accounts' datapoint.
	if ( isError( error, 'noAdSenseAccount' ) ) {
		return ACCOUNT_STATUS_NONE;
	}
	if ( isError( error, 'disapprovedAccount' ) ) {
		return ACCOUNT_STATUS_DISAPPROVED;
	}

	return undefined;
};

const alertsErrorToStatus = ( error ) => {
	// These specific errors represent account statuses for our purposes.
	// They can be returned from the 'alerts' datapoint.
	if ( isError( error, 'accountPendingReview' ) ) {
		return ACCOUNT_STATUS_PENDING;
	}

	return undefined;
};

function urlChannelsErrorToStatus( error ) {
	if (
		error?.message &&
		error.message.toLowerCase() === 'ad client not found.'
	) {
		return ACCOUNT_STATUS_PENDING;
	}

	return undefined;
}

const isError = ( error, errorReason ) => {
	if ( ! error || ! error.data ) {
		return false;
	}

	return errorReason === error.data.reason;
};
