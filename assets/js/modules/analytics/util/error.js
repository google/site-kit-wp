/**
 * Analytics error utility functions.
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
 * Checks whether the given error is a restricted metrics error.
 *
 * @since 1.18.0
 *
 * @param {Object}          error         Error object instance.
 * @param {(RegExp|string)} [metricMatch] Expression for matching specific metrics. Defaults to match any metric.
 * @return {boolean} `true` if a restricted metrics error, otherwise `false`.
 */
export function isRestrictedMetricsError( error, metricMatch ) {
	if (
		error?.code !== 400 ||
		! error.message?.startsWith?.( 'Restricted metric' )
	) {
		return false;
	}

	if ( metricMatch instanceof RegExp || typeof metricMatch === 'string' ) {
		const metrics = error.message.match( /ga:[a-z]+/gi );
		return metrics.some( ( metric ) => metric.match( metricMatch ) );
	}

	return true;
}
