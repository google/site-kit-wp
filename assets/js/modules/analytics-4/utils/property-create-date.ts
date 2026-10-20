/**
 * Analytics 4 property creation date utility.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { getDateString } from '@/js/util';

/**
 * Gets the day an Analytics property was created on.
 *
 * @since 1.190.0
 *
 * @param {(number|undefined)} propertyCreateTime The property's creation time in milliseconds, as `getPropertyCreateTime()` returns it.
 * @return {(string|undefined)} The creation day in the browser's time zone, as `YYYY-MM-DD`, or `undefined` when there is no creation time.
 */
export function getPropertyCreateDate(
	propertyCreateTime: number | undefined
): string | undefined {
	if ( ! propertyCreateTime ) {
		return undefined;
	}

	// eslint-disable-next-line sitekit/no-direct-date -- The date comes from the property's creation time, not from the reference date.
	return getDateString( new Date( propertyCreateTime ) );
}
