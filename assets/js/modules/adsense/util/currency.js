/**
 * Currency Utilities.
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
 * Extracts the currency string from a given AdSense report,
 * and returns the appropriate Intl formatting options for the currency.
 * Falls back to decimal formatting if no currency is available.
 *
 * @since 1.32.0
 *
 * @param {Object} adsenseReport AdSense Report.
 * @return {Intl.NumberFormatOptions} Formatting options.
 */
export function getCurrencyFormat( adsenseReport ) {
	const currency = adsenseReport?.headers?.[ 0 ].currencyCode;
	return currency
		? {
				style: 'currency',
				currency,
		  }
		: {
				// Fall back to decimal if currency hasn't yet loaded.
				style: 'decimal',
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
		  };
}
