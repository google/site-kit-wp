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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';

// Actions
const FETCH_REPORT = 'FETCH_REPORT';
const START_FETCH_REPORT = 'START_FETCH_REPORT';
const FINISH_FETCH_REPORT = 'FINISH_FETCH_REPORT';
const CATCH_FETCH_REPORT = 'CATCH_FETCH_REPORT';
const RECEIVE_REPORT = 'RECEIVE_REPORT';

export const INITIAL_STATE = {
	isFetchingReport: {},
	reports: {},
};

export const actions = {
	/**
	 * Fetches a PageSpeed Insights report.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}	options Options used for generating the report.
	 * @return {Object} Redux-style action.
	 */
	*fetchReport( options ) {
		let response, error;

		yield {
			payload: { options },
			type: START_FETCH_REPORT,
		};

		try {
			const report = yield {
				payload: { options },
				type: FETCH_REPORT,
			};

			yield actions.receiveReport( report, options );

			yield {
				payload: { options },
				type: FINISH_FETCH_REPORT,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: {
					options,
					error,
				},
				type: CATCH_FETCH_REPORT,
			};
		}

		return { response, error };
	},

	/**
	 * Adds report to the store.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} 	report				Report to add.
	 * @param {Object}	[options]			Options used for generating the report.
	 * @param {string} 	[options.strategy]	Strategy used for generating the report.
	 * @param {string} 	[options.url]		URL used for generating the report.
	 * @return {Object} Redux-style action.
	 */
	receiveReport( report, { strategy, url } = {} ) {
		invariant( isPlainObject( report ), 'report must be an object.' );

		return {
			payload: { report, strategy, url },
			type: RECEIVE_REPORT,
		};
	},

};

export const controls = {
	[ FETCH_REPORT ]: ( { payload: { options: { strategy, url } = {} } } ) => {
		return API.get( 'modules', 'pagespeed-insights', 'pagespeed', { strategy, url } );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_FETCH_REPORT: {
			const { options: { strategy, url } } = payload;

			return {
				...state,
				isFetchingReport: {
					...state.isFetchingReport,
					[ `${ strategy }::${ url }` ]: true,
				},
			};
		}

		case FINISH_FETCH_REPORT: {
			const { options: { strategy, url } } = payload;

			return {
				...state,
				isFetchingReport: {
					...state.isFetchingReport,
					[ `${ strategy }::${ url }` ]: false,
				},
			};
		}

		case RECEIVE_REPORT: {
			const { report, strategy, url } = payload;

			return {
				...state,
				reports: {
					...state.reports,
					[ `${ strategy }::${ url }` ]: { ...report },
				},
			};
		}

		case CATCH_FETCH_REPORT: {
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
		const {
			strategy = 'mobile',
			url = registry.select( CORE_SITE ).getReferenceSiteURL(),
		} = options;
		const existingReport = registry.select( STORE_NAME ).getReport( { strategy, url } );

		// If there is already a report loaded in state, consider it fulfilled and don't make an API request.
		if ( existingReport ) {
			return;
		}

		yield actions.fetchReport( { strategy, url } );
	},
};

export const selectors = {
	/**
	 * Gets a PageSpeed Insights report for the given strategy and URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}         		state				Data store's state.
	 * @param {Object}				[options]			Optional options for generating the report.
	 * @param {string} 				[options.strategy]	Optional strategy. Default 'mobile'.
	 * @param {string} 				[options.url]		Optional URL. Default the site's reference URL.
	 * @return {(Object|undefined)} A PageSpeed Insights report; `undefined` if not loaded.
	 */
	getReport( state, { strategy, url } = {} ) {
		const { reports } = state;

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
