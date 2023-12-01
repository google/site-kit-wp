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
