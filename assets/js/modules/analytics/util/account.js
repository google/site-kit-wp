/**
 * Account helpers.
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
import invariant from 'invariant';

/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { countryCodesByTimezone } from './countries-timezones';

/**
 * Gets default values for a new account.
 *
 * @since 1.17.0
 *
 * @param {Object} args              Site information.
 * @param {string} args.siteName     Site name.
 * @param {string} args.siteURL      Site home URL.
 * @param {string} args.timezone     Site timezone.
 * @param {string} _fallbackTimezone Fallback timezone. Defaults to local timezone.
 *                                   This parameter should only be used for providing a deterministic fallback in tests.
 * @return {Object} Default values.
 */
export function getAccountDefaults(
	{ siteName, siteURL, timezone },
	_fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
) {
	invariant( isURL( siteURL ), 'A valid siteURL is required.' );

	const { hostname, pathname } = new URL( siteURL );
	const tz = countryCodesByTimezone[ timezone ]
		? timezone
		: _fallbackTimezone;

	return {
		accountName: siteName || hostname,
		propertyName: `${ hostname }${ pathname }`.replace( /\/$/, '' ),
		profileName: _x(
			'All Web Site Data',
			'default Analytics view name',
			'google-site-kit'
		),
		countryCode: countryCodesByTimezone[ tz ],
		timezone: tz,
	};
}
