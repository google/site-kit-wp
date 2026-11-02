/**
 * Traffic Overview `getPropertyCreatedMarkerDate` utility.
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
 * Gets the day the Analytics property was created, when a chart plots that day.
 *
 * @since n.e.x.t
 *
 * @param {(string|undefined)} propertyCreateDate The day the Analytics property was created, as `YYYY-MM-DD`, or `undefined` when it is not known.
 * @param {string}             firstDate          The first day the chart plots, as `YYYY-MM-DD`.
 * @param {string}             lastDate           The last day the chart plots, as `YYYY-MM-DD`.
 * @return {(string|undefined)} `propertyCreateDate` when it is on or between `firstDate` and `lastDate`, or `undefined` otherwise.
 */
export function getPropertyCreatedMarkerDate(
	propertyCreateDate: string | undefined,
	firstDate: string,
	lastDate: string
): string | undefined {
	return propertyCreateDate &&
		propertyCreateDate >= firstDate &&
		propertyCreateDate <= lastDate
		? propertyCreateDate
		: undefined;
}
