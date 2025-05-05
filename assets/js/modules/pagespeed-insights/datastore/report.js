/**
 * `modules/pagespeed-insights` data store: report.
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
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import {
	combineStores,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { MODULES_PAGESPEED_INSIGHTS } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchGetReportStore = createFetchStore( {
	baseName: 'getReport',
	controlCallback: ( { strategy, url } ) => {
		return get( 'modules', 'pagespeed-insights', 'pagespeed', {
			strategy,
			url,
		} );
	},
	reducerCallback: createReducer( ( state, report, { strategy, url } ) => {
		state.reports = state.reports || {};
		state.reports[ `${ strategy }::${ url }` ] = report;
	} ),
	argsToParams: ( url, strategy ) => {
		return {
			strategy,
			url,
		};
	},
	validateParams: ( { strategy, url } = {} ) => {
		invariant( isURL( url ), 'a valid url is required to fetch a report.' );
		invariant(
			typeof strategy === 'string',
			'a valid strategy is required to fetch a report.'
		);
	},
} );

const baseInitialState = {
	reports: {},
};

const baseResolvers = {
	*getReport( url, strategy ) {
		if ( ! url || ! strategy ) {
			return;
		}

		yield fetchGetReportStore.actions.fetchGetReport( url, strategy );
	},
};

const baseSelectors = {
	/**
	 * Gets a PageSpeed Insights report for the given strategy and URL.
	 *
	 * @since 1.10.0
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} url      URL used for generating the report.
	 * @param {string} strategy Strategy used for generating the report.
	 * @return {(Object|undefined)} A PageSpeed Insights report; `undefined` if not loaded.
	 */
	getReport( state, url, strategy ) {
		const { reports } = state;

		return reports[ `${ strategy }::${ url }` ];
	},

	/**
	 * Gets report audits for the given strategy and URL.
	 *
	 * @since 1.22.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Report audits.
	 */
	getAudits: createRegistrySelector(
		( select ) => ( state, url, strategy ) => {
			const report = select( MODULES_PAGESPEED_INSIGHTS ).getReport(
				url,
				strategy
			);
			if ( report === undefined ) {
				return undefined;
			}

			const { lighthouseResult } = report || {};
			const { audits } = lighthouseResult || {};
			if ( ! audits ) {
				return {};
			}

			return audits;
		}
	),

	/**
	 * Gets report audits for the given strategy and URL and stack pack.
	 *
	 * The selector essentially filters audits to include only those that have
	 * a description available in the requested stack pack.
	 *
	 * @since 1.22.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Report audits.
	 */
	getAuditsWithStackPack: createRegistrySelector(
		( select ) => ( state, url, strategy, stackPackID ) => {
			const audits = select( MODULES_PAGESPEED_INSIGHTS ).getAudits(
				url,
				strategy
			);
			if ( ! audits ) {
				return {};
			}

			const filteredAudits = {};
			Object.keys( audits ).forEach( ( auditID ) => {
				const stackPack = select(
					MODULES_PAGESPEED_INSIGHTS
				).getStackPackDescription(
					url,
					strategy,
					auditID,
					stackPackID
				);
				if ( stackPack ) {
					filteredAudits[ auditID ] = audits[ auditID ];
				}
			} );

			return filteredAudits;
		}
	),

	/**
	 * Gets stack pack descriptions for a sepcific report audit.
	 *
	 * @since 1.22.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|null|undefined)} Stack pack description object for an
	 *                                   audit, null if the given stack pack is
	 *                                   not available for the audit, undefined
	 *                                   if not loaded yet.
	 */
	getStackPackDescription: createRegistrySelector(
		( select ) => ( state, url, strategy, auditID, stackPackID ) => {
			const report = select( MODULES_PAGESPEED_INSIGHTS ).getReport(
				url,
				strategy
			);
			if ( report === undefined ) {
				return undefined;
			}

			const { lighthouseResult } = report || {};
			const { stackPacks } = lighthouseResult || [];
			if ( ! Array.isArray( stackPacks ) ) {
				return null;
			}

			const stackPack = stackPacks.find(
				( { id, descriptions } ) =>
					id === stackPackID && !! descriptions[ auditID ]
			);
			if ( ! stackPack ) {
				return null;
			}

			return {
				id: stackPack.id,
				icon: stackPack.iconDataURL,
				title: stackPack.title,
				description: stackPack.descriptions[ auditID ],
			};
		}
	),
};

const store = combineStores( fetchGetReportStore, {
	initialState: baseInitialState,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
