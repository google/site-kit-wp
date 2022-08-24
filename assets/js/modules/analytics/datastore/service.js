/**
 * `modules/analytics` data store: service.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS } from './constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { reportArgsToURLSegment } from '../util/report-args';
import { escapeURI } from '../../../util/escape-uri';
const { createRegistrySelector } = Data;

export const selectors = {
	/**
	 * Gets a URL to the service.
	 *
	 * @since 1.14.0
	 *
	 * @param {Object} state        Data store's state.
	 * @param {Object} [args]       Object containing optional path and query args.
	 * @param {string} [args.path]  A path to append to the base url.
	 * @param {Object} [args.query] Object of query params to be added to the URL.
	 * @return {(string|undefined)} The URL to the service, or `undefined` if not loaded.
	 */
	getServiceURL: createRegistrySelector(
		( select ) =>
			( state, { path, query } = {} ) => {
				const userEmail = select( CORE_USER ).getEmail();

				if ( userEmail === undefined ) {
					return undefined;
				}

				const baseURI = 'https://analytics.google.com/analytics/web/';
				const queryParams = query
					? { ...query, authuser: userEmail }
					: { authuser: userEmail };
				const baseURIWithQuery = addQueryArgs( baseURI, queryParams );
				if ( path ) {
					const sanitizedPath = `/${ path.replace( /^\//, '' ) }`;
					return `${ baseURIWithQuery }#${ sanitizedPath }`;
				}
				return baseURIWithQuery;
			}
	),

	/**
	 * Gets a URL for a specific reporting view on the service.
	 *
	 * @since 1.22.0
	 *
	 * @param {Object} state        Data store's state.
	 * @param {string} type         Report type.
	 * @param {Object} [reportArgs] Report-specific arguments for targeting a specific sub-view.
	 * @return {(string|undefined)} The service URL.
	 */
	getServiceReportURL: createRegistrySelector(
		( select ) =>
			( state, type, reportArgs = {} ) => {
				const accountID = select( MODULES_ANALYTICS ).getAccountID();
				const internalWebPropertyID =
					select( MODULES_ANALYTICS ).getInternalWebPropertyID();
				const profileID = select( MODULES_ANALYTICS ).getProfileID();

				invariant(
					type,
					'type is required to get a service report URL.'
				);

				if ( ! accountID || ! internalWebPropertyID || ! profileID ) {
					return undefined;
				}

				const argsSegment = reportArgsToURLSegment( reportArgs );
				let path = escapeURI`/report/${ type }/a${ accountID }w${ internalWebPropertyID }p${ profileID }/`;

				if ( argsSegment ) {
					path += `${ argsSegment }/`;
				}

				return selectors.getServiceURL( state, { path } );
			}
	),
};

const store = {
	selectors,
};

export default store;
