/**
 * modules/pagespeed-insights data store: report.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';

// Actions
const FETCH_REPORT = 'FETCH_REPORT';
const RECEIVE_REPORT = 'RECEIVE_REPORT';
const RECEIVE_REPORT_SUCCEEDED = 'RECEIVE_REPORT_SUCCEEDED';
const RECEIVE_REPORT_FAILED = 'RECEIVE_REPORT_FAILED';

export const INITIAL_STATE = {
	isFetchingReport: {},
	reports: {},
};

export const actions = {
	fetchReport( options ) {
		invariant( 'object' === typeof options, 'options must be an object.' );

		return {
			payload: { options },
			type: FETCH_REPORT,
		};
	},

	receiveReport( { options, report } ) {
		invariant( 'object' === typeof options, 'options must be an object.' );
		invariant( 'object' === typeof report, 'report must be an array.' );

		return {
			payload: { options, report },
			type: RECEIVE_REPORT,
		};
	},

	receiveReportSucceeded( options ) {
		invariant( 'object' === typeof options, 'options must be an object.' );

		return {
			payload: { options },
			type: RECEIVE_REPORT_SUCCEEDED,
		};
	},

	receiveReportFailed( { options, error } ) {
		invariant( 'object' === typeof options, 'options must be an object.' );
		invariant( error, 'error is required.' );

		return {
			payload: { options, error },
			type: RECEIVE_REPORT_FAILED,
		};
	},
};

export const controls = {
	[ FETCH_REPORT ]: ( { payload: { options } } ) => {
		const { strategy, url } = options;

		return API.get( 'modules', 'pagespeed-insights', 'pagespeed', { strategy, url } );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case FETCH_REPORT: {
			const { options: { strategy, url } } = payload;

			return {
				...state,
				isFetchingReport: {
					...state.isFetchingReport,
					[ `${ strategy }::${ url }` ]: true,
				},
			};
		}

		case RECEIVE_REPORT: {
			const { options: { strategy, url }, report } = payload;

			return {
				...state,
				reports: {
					...state.reports,
					[ `${ strategy }::${ url }` ]: report,
				},
			};
		}

		case RECEIVE_REPORT_SUCCEEDED: {
			const { options: { strategy, url } } = payload;

			return {
				...state,
				isFetchingReport: {
					...state.isFetchingReport,
					[ `${ strategy }::${ url }` ]: false,
				},
			};
		}

		case RECEIVE_REPORT_FAILED: {
			const { options: { strategy, url }, error } = payload;

			return {
				...state,
				error,
				isFetchingReport: {
					...state.isFetchingReport,
					[ `${ strategy }::${ url }` ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getReport( options = {} ) {
		const registry = yield Data.commonActions.getRegistry();

		if ( typeof options.strategy === 'undefined' ) {
			options.strategy = 'mobile';
		}
		if ( typeof options.url === 'undefined' ) {
			options.url = registry.select( CORE_SITE ).getReferenceSiteURL();
		}

		const existingReport = registry.select( STORE_NAME ).getReport( options );

		// If there is already a report loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingReport ) {
			return;
		}

		try {
			const report = yield actions.fetchReport( options );

			yield actions.receiveReport( { options, report } );

			return yield actions.receiveReportSucceeded( options );
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveReportFailed( { options, error } );
		}
	},
};

export const selectors = {
	/**
	 * Gets a PageSpeed Insights report for the given options.
	 *
	 * The report generated will include the following metrics: TODO get metrics for below
	 * *
	 * *
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}         state              Data store's state.
	 * @param {?Object}        options            Optional. Options for generating the report.
	 * @param {string}         options.strategy   Strategy. Default 'mobile'.
	 * @param {string}         options.url   	  URL. Default the site's reference URL.
	 * @return {?Array.<Object>} An AdSense report; `undefined` if not loaded.
	 */
	getReport( state, options = {} ) {
		const { reports } = state;
		const { strategy, url } = options;

		return reports[ `${ strategy }::${ url }` ];
	},
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
