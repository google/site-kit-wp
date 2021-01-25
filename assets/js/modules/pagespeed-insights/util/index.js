/**
 * PageSpeed Insights dashboard utility functions.
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
 * WordPress dependencies
 */
import { CATEGORY_FAST, CATEGORY_AVERAGE, CATEGORY_SLOW } from './constants';

/**
 * Retrieves the score category slug based on the given score.
 *
 * @since 1.0.0
 *
 * @param {number} score Score between 1.0 and 0.0.
 * @return {string} Either 'fast', 'average', or 'slow'.
 */
export function getScoreCategory( score ) {
	if ( 0.9 <= score ) {
		return CATEGORY_FAST;
	}

	if ( 0.5 <= score ) {
		return CATEGORY_AVERAGE;
	}

	return CATEGORY_SLOW;
}
