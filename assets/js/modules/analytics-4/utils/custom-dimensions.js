/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { MODULES_ANALYTICS_4 } from '../datastore/constants';
import { possibleCustomDimensions } from '../datastore/custom-dimensions';

/**
 * Provides custom dimension error data to the given registry.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry                The registry to set up.
 * @param {Object} options                 Error options.
 * @param {string} options.customDimension The custom dimension slug.
 * @param {Object} options.error           The error object.
 */
export const provideCustomDimensionError = (
	registry,
	{ customDimension, error }
) => {
	const propertyID = registry.select( MODULES_ANALYTICS_4 ).getPropertyID();

	const options = [ propertyID, possibleCustomDimensions[ customDimension ] ];

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveError( error, 'createCustomDimension', options );
};

/**
 * Checks whether the given error is an invalid custom dimension error.
 *
 * @since n.e.x.t
 *
 * @param {Object} error Error object instance.
 * @return {boolean} `true` if it is an invalid custom dimension error, otherwise `false`.
 */
export function isInvalidCustomDimensionError( error ) {
	return (
		error?.code === 400 &&
		error?.message?.includes( 'is not a valid dimension' )
	);
}
