/**
 * PAX utility functions.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { stringToDate } from '@/js/util';

/**
 * Returns formatted date object.
 *
 * @since 1.127.0
 *
 * @param {string} dateString Date in 'YYYY-MM-DD' format.
 * @return {Date} Date instance.
 */
export function formatPaxDate( dateString ) {
	const dateObject = stringToDate( dateString );

	return {
		year: dateObject.getFullYear(),
		// PAX uses a 1-indexed month value (to match the month string value).
		//
		// Our `stringToDate()` function returns 0-indexed month values,
		// so we need to adjust the values for PAX.
		month: dateObject.getMonth() + 1,
		day: dateObject.getDate(),
	};
}
