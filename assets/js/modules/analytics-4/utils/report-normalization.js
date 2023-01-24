/**
 * Report normalization utilities.
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
 * External dependencies
 */
import castArray from 'lodash/castArray';
import isPlainObject from 'lodash/isPlainObject';
import memize from 'memize';

/**
 * Normalizes report options.
 *
 * @since n.e.x.t
 *
 * @param {Object} options Report options object.
 * @return {Object} Normalized options object.
 */
export const normalizeReportOptions = memize(
	( { metrics, dimensions, ...options } = {} ) => {
		// TODO: build this out to normalize all options used.
		return {
			metrics: normalizeMetrics( metrics ),
			dimensions: normalizeDimensions( dimensions ),
			...options,
		};
	}
);

const normalizeMetrics = ( metrics ) => {
	return castArray( metrics ).filter(
		( metric ) => isPlainObject( metric ) || typeof metric === 'string'
	);
};

const normalizeDimensions = ( dimensions ) => {
	return castArray( dimensions ).filter(
		( dimension ) =>
			isPlainObject( dimension ) || typeof dimension === 'string'
	);
};
