/**
 * Calculate expiring GA4 Activation Banner dismissal.
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
 * Internal dependencies
 */
import { getTimeInSeconds, stringToDate } from '../../../util';

/**
 * Gets the time in seconds to expire a dismissal of the GA4 Activation Banner.
 *
 * @since 1.82.0
 *
 * @param {string} referenceDateString Date on which to calculate the expiry for the dismissal.
 * @return {number} Time in seconds for a dismissal to expire.
 */
export function getBannerDismissalExpiryTime( referenceDateString ) {
	const referenceDate = stringToDate( referenceDateString );

	// If dismissed before May 2023, show the banner again after 30 days.
	if ( referenceDate < stringToDate( '2023-05-01' ) ) {
		return getTimeInSeconds( 'month' );
	}

	// If dismissed in May 2023, show the banner again in June 2023.
	if (
		stringToDate( '2023-05-01' ) <= referenceDate &&
		referenceDate < stringToDate( '2023-06-01' )
	) {
		return Math.max(
			31 * getTimeInSeconds( 'day' ) -
				referenceDate.getDate() * getTimeInSeconds( 'day' ),
			getTimeInSeconds( 'day' ) * 2
		);
	}

	// If dismissed after May 2023, show the banner every 2 days.
	return getTimeInSeconds( 'day' ) * 2;
}
