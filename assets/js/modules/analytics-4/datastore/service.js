/**
 * `modules/analytics-4` data store: service.
 *
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
import { createRegistrySelector } from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from './constants';
import { REPORT_ARGS_NAV_KEY } from '../constants';
import { escapeURI } from '../../../util/escape-uri';
import { generateDateRangeArgs } from '../utils/report-date-range-args';
import {
	generateReportDetailArgs,
	generateReportFilterArgs,
} from '../utils/report-args';

export const selectors = {
	/**
	 * Gets a URL to the service.
	 *
	 * @since 1.119.0
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
				let serviceURL = 'https://analytics.google.com/analytics/web/';

				if ( query ) {
					serviceURL = addQueryArgs( serviceURL, query );
				}

				if ( path ) {
					const sanitizedPath = `/${ path.replace( /^\//, '' ) }`;
					serviceURL = `${ serviceURL }#${ sanitizedPath }`;
				}

				const accountChooserBaseURI =
					select( CORE_USER ).getAccountChooserURL( serviceURL );

				if ( accountChooserBaseURI === undefined ) {
					return undefined;
				}

				return accountChooserBaseURI;
			}
	),

	/**
	 * Gets a URL for a specific Analytics 4 reporting view on the service.
	 *
	 * @since 1.98.0
	 *
	 * @param {Object} state        Data store's state.
	 * @param {string} type         Report type.
	 * @param {Object} [reportArgs] Report-specific arguments for targeting a specific sub-view.
	 * @return {(string|undefined)} The service URL.
	 */
	getServiceReportURL: createRegistrySelector(
		( select ) =>
			( state, type, reportArgs = {} ) => {
				invariant(
					type,
					'type is required to get a service report URL.'
				);

				const propertyID =
					select( MODULES_ANALYTICS_4 ).getPropertyID();

				if ( ! propertyID ) {
					return undefined;
				}

				const {
					dates,
					details = {},
					filters = {},
					otherArgs = {},
				} = reportArgs;

				const embeddedParams = {
					[ REPORT_ARGS_NAV_KEY ]: 'maui',
					...( dates ? generateDateRangeArgs( dates ) : {} ),
					...generateReportDetailArgs( details ),
					...generateReportFilterArgs( filters ),
				};

				// Here we turn embeddedParams into a query string without any URI encoding, as the
				// result will be encoded by addQueryArgs, and we don't want to double-encode it.
				const params = Object.entries( embeddedParams )
					.map( ( [ key, value ] ) => `${ key }=${ value }` )
					.join( '&' );

				const path = addQueryArgs(
					escapeURI`/p${ propertyID }/reports/explorer`,
					{
						params,
						r: type,
						...otherArgs,
					}
				);

				return select( MODULES_ANALYTICS_4 ).getServiceURL( {
					query: {
						pli: 1,
					},
					path,
				} );
			}
	),

	/**
	 * Gets an entity access URL on the service.
	 *
	 * @since 1.109.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {string|undefined} The entity access URL to the service.
	 */
	getServiceEntityAccessURL: createRegistrySelector( ( select ) => () => {
		const accountID = select( MODULES_ANALYTICS_4 ).getAccountID();
		const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();
		const webDataStreamID =
			select( MODULES_ANALYTICS_4 ).getWebDataStreamID();

		if ( ! accountID || ! propertyID || ! webDataStreamID ) {
			return undefined;
		}

		return select( MODULES_ANALYTICS_4 ).getServiceURL( {
			path: escapeURI`/a${ accountID }p${ propertyID }/admin/streams/table/${ webDataStreamID }`,
		} );
	} ),
};

const store = {
	selectors,
};

export default store;
