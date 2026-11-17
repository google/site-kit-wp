/**
 * Site Goals event name dimension filters.
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
 * Gets the dimension filters that limit a report to the given events.
 *
 * The events are matched with an `inListFilter` on `eventName`. A breakdown
 * filter, when given, further limits the report to one breakdown tab.
 *
 * @since 1.180.0
 *
 * @param {string[]} eventNames        Names of the events to match any of.
 * @param {Object}   [breakdownFilter] Optional dimension filter scoping the report to a breakdown tab.
 * @return {Object|undefined} The dimension filters, or `undefined` when there are no event names.
 */
export function getDimensionFiltersForEvents(
	eventNames: string[],
	breakdownFilter?: Record< string, unknown >
) {
	if ( ! eventNames.length ) {
		return undefined;
	}

	return {
		eventName: {
			filterType: 'inListFilter',
			value: eventNames,
		},
		...breakdownFilter,
	};
}
