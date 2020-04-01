/**
 * core/site data store: site info.
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
import Data from 'googlesitekit-data';
import { STORE_NAME } from './index';

const { createRegistrySelector } = Data;

// Actions
const RECEIVE_SITE_INFO = 'RECEIVE_SITE_INFO';

export const INITIAL_STATE = {
	siteInfo: {
		adminURL: undefined,
		ampMode: undefined,
		currentEntityURL: undefined,
		currentEntityID: undefined,
		currentEntityTitle: undefined,
		currentEntityType: undefined,
		homeURL: undefined,
		referenceSiteURL: undefined,
	},
};

export const actions = {
	/**
	 * Stores site info in the datastore.
	 *
	 * Because this is frequently-accessed data, this is usually sourced
	 * from a global variable (`_googlesitekitSiteData`), set by PHP
	 * in the `before_print` callback for `googlesitekit-datastore-site`.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} siteInfo Site info, usually supplied via a global variable from PHP.
	 * @return {Object} Redux-style action.
	 */
	receiveSiteInfo( siteInfo ) {
		invariant( siteInfo, 'siteInfo is required.' );

		return {
			payload: { siteInfo },
			type: RECEIVE_SITE_INFO,
		};
	},
};

export const controls = {};

export const reducer = ( state, { payload, type } ) => {
	switch ( type ) {
		case RECEIVE_SITE_INFO: {
			const {
				adminURL,
				ampMode,
				currentEntityURL,
				currentEntityID,
				currentEntityTitle,
				currentEntityType,
				homeURL,
				referenceSiteURL,
			} = payload.siteInfo;

			return {
				...state,
				siteInfo: {
					adminURL,
					ampMode,
					currentEntityURL,
					currentEntityID: parseInt( currentEntityID, 10 ),
					currentEntityTitle,
					currentEntityType,
					homeURL,
					referenceSiteURL,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getSiteInfo() {
		if ( ! global._googlesitekitBaseData || ! global._googlesitekitEntityData ) {
			global.console.error( 'Could not load core/site info.' );
			return;
		}

		const {
			adminURL,
			ampMode,
			homeURL,
			referenceSiteURL,
		} = global._googlesitekitBaseData;
		const {
			currentEntityURL,
			currentEntityID,
			currentEntityTitle,
			currentEntityType,
		} = global._googlesitekitEntityData;

		yield actions.receiveSiteInfo( {
			adminURL,
			ampMode,
			currentEntityURL,
			currentEntityID,
			currentEntityTitle,
			currentEntityType,
			homeURL,
			referenceSiteURL,
		} );
	},
};

export const selectors = {
	/**
	 * Gets all site info from this data store.
	 *
	 * Not intended to be used publicly; this is largely here so other selectors can
	 * request data using the selector/resolver pattern.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object} Site connection info.
	 */
	getSiteInfo( state ) {
		const {
			adminURL,
			ampMode,
			currentEntityURL,
			currentEntityID,
			currentEntityTitle,
			currentEntityType,
			homeURL,
			referenceSiteURL,
		} = state.siteInfo || {};

		return {
			adminURL,
			ampMode,
			currentEntityURL,
			currentEntityID,
			currentEntityTitle,
			currentEntityType,
			homeURL,
			referenceSiteURL,
		};
	},

	/**
	 * Gets a site's admin URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?string} This site's admin URL.
	 */
	getAdminURL: createRegistrySelector( ( select ) => () => {
		const { adminURL } = select( STORE_NAME ).getSiteInfo();

		return adminURL;
	} ),

	/**
	 * Gets a site's AMP mode.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?string} AMP Mode.
	 */
	getAMPMode: createRegistrySelector( ( select ) => () => {
		const { ampMode } = select( STORE_NAME ).getSiteInfo();

		return ampMode;
	} ),

	/**
	 * Gets the current entity's ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?number} Current entity's ID.
	 */
	getCurrentEntityID: createRegistrySelector( ( select ) => () => {
		const { currentEntityID } = select( STORE_NAME ).getSiteInfo();

		return currentEntityID;
	} ),

	/**
	 * Gets the current entity's title.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?string} Current entity's title.
	 */
	getCurrentEntityTitle: createRegistrySelector( ( select ) => () => {
		const { currentEntityTitle } = select( STORE_NAME ).getSiteInfo();

		return currentEntityTitle;
	} ),

	/**
	 * Gets the current entity's title.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?string} Current entity's type.
	 */
	getCurrentEntityType: createRegistrySelector( ( select ) => () => {
		const { currentEntityType } = select( STORE_NAME ).getSiteInfo();

		return currentEntityType;
	} ),

	/**
	 * Gets the current entity's reference URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?string} Current entity's reference URL.
	 */
	getCurrentEntityURL: createRegistrySelector( ( select ) => () => {
		const { currentEntityURL } = select( STORE_NAME ).getSiteInfo();

		return currentEntityURL;
	} ),

	/**
	 * Gets a site's homepage URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?string} This site's home URL.
	 */
	getHomeURL: createRegistrySelector( ( select ) => () => {
		const { homeURL } = select( STORE_NAME ).getSiteInfo();

		return homeURL;
	} ),

	/**
	 * Gets a site's reference site URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?string} The reference site URL.
	 */
	getReferenceSiteURL: createRegistrySelector( ( select ) => () => {
		const { referenceSiteURL } = select( STORE_NAME ).getSiteInfo();

		return referenceSiteURL;
	} ),

	/**
	 * Returns true if this site supports AMP.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?string} `true` if AMP support is enabled, `false` if not. Returns `undefined` if not loaded.
	 */
	isAmp: createRegistrySelector( ( select ) => () => {
		const ampMode = select( STORE_NAME ).getAMPMode();

		return ampMode !== undefined ? !! ampMode : ampMode;
	} ),
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
