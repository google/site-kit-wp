/**
 * Account helpers.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import invariant from 'invariant';

/**
 * WordPress dependencies
 */
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { countryCodesByTimezone } from './countries-timezones';
import { ENHANCED_MEASUREMENT_ENABLED } from '../datastore/constants';

/**
 * Gets default values for a new account.
 *
 * @since 1.98.0
 * @since 1.111.0 Added enhanced measurement enabled state to return value.
 *
 * @param {Object} args              Site information.
 * @param {string} args.siteName     Site name.
 * @param {string} args.siteURL      Site home URL.
 * @param {string} args.timezone     Site timezone.
 * @param {string} _fallbackTimezone Fallback timezone. Defaults to local timezone.
 *                                   This parameter should only be used for providing a deterministic fallback in tests.
 * @return {Object} Default property values for a new account.
 */
export function getAccountDefaults(
	{ siteName, siteURL, timezone },
	_fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
) {
	invariant( isURL( siteURL ), 'A valid siteURL is required.' );

	const { hostname, pathname } = new URL( siteURL );

	return {
		accountName: siteName || hostname,
		propertyName: `${ hostname }${ pathname }`.replace( /\/$/, '' ),
		dataStreamName: hostname,
		countryCode:
			countryCodesByTimezone[ timezone ] ||
			countryCodesByTimezone[ _fallbackTimezone ],
		timezone: countryCodesByTimezone[ timezone ]
			? timezone
			: _fallbackTimezone,
		[ ENHANCED_MEASUREMENT_ENABLED ]: true,
	};
}

/**
 * Appends an account ID to an account object.
 *
 * @since 1.138.0
 *
 * @param {Object} account Account object.
 * @return {Object} Account object with an appended ID.
 */
export const populateAccountID = ( account ) => {
	const matches = account.account?.match( /accounts\/([^/]+)/ );
	const _id = matches?.[ 1 ];

	return {
		...account,
		_id,
	};
};

/**
 * Appends property and account IDs to a property object.
 *
 * @since 1.138.0
 *
 * @param {Object} property Property object.
 * @return {Object} Property object with appended IDs.
 */
export const populatePropertyAndAccountIds = ( property ) => {
	const propertyMatches = property.property?.match( /properties\/([^/]+)/ );
	const _id = propertyMatches?.[ 1 ];

	const accountMatches = property.parent?.match( /accounts\/([^/]+)/ );
	const _accountID = accountMatches?.[ 1 ];

	return {
		...property,
		_id,
		_accountID,
	};
};
