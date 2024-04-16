/**
 * API utility functions.
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
 * Internal dependencies
 */
import { trackEvent } from './';

// Error codes in excludedErrorCodes will not be tracked by trackAPIError.
export const excludedErrorCodes = [
	'fetch_error', // Client failed to fetch from WordPress.
];

// Datapoints that we want to exclude from tracking API errors.
export const excludedEndpoints = [ 'core/site/data/connection-check' ];

/**
 * Tracks API errors.
 *
 * @since 1.20.0
 *
 * @param {Object} args            The request arguments.
 * @param {Object} args.method     The request method.
 * @param {Object} args.type       The request type.
 * @param {Object} args.identifier The request identifier.
 * @param {Object} args.datapoint  The request datapoint.
 * @param {Object} args.error      The request error.
 */
export async function trackAPIError( args ) {
	const { method, type, identifier, datapoint, error } = args;

	// Return early if the endpoint should be excluded from tracking.
	const endpoint = `${ type }/${ identifier }/data/${ datapoint }`;
	if ( excludedEndpoints.includes( endpoint ) ) {
		return;
	}

	// Exclude certain errors from tracking based on error code.
	if ( ! error || excludedErrorCodes.includes( error?.code ) ) {
		return;
	}

	let labelMeta = `code: ${ error.code }`;
	if ( error.data?.reason ) {
		labelMeta += `, reason: ${ error.data.reason }`;
	}

	await trackEvent(
		'api_error',
		`${ method }:${ type }/${ identifier }/data/${ datapoint }`,
		`${ error.message } (${ labelMeta })`,
		error.data?.status || error.code
	);
}
