/**
 * Request with date range utility.
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
 * Gets a copy of the given data request object with the data.dateRange populated via filter, if not set.
 * Respects the current dateRange value, if set.
 *
 * @since 1.0.0
 *
 * @param {Object} originalRequest Data request object.
 * @param {string} dateRange       Default date range slug to use if not specified in the request.
 * @return {Object} New data request object.
 */
export const requestWithDateRange = ( originalRequest, dateRange ) => {
	// Make copies for reference safety, ensuring data exists.
	const request = { data: {}, ...originalRequest };
	// Use the dateRange in request.data if passed, fallback to provided default value.

	// Provide the prev-dateRange-days to allow withData to handle the queries for <AdSensePerformanceWidget /> - see #317.
	if ( request.data.dateRange === 'prev-date-range-placeholder' ) {
		const prevDateRange = dateRange.replace( 'last', 'prev' );
		request.data = {
			...request.data,
			dateRange: prevDateRange,
		};
		return request;
	}

	request.data = { dateRange, ...request.data };

	return request;
};
