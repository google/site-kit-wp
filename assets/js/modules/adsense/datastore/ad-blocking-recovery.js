/**
 * `modules/adsense` data store: Ad Blocking Recovery.
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
 * Internal dependencies
 */
import { set } from 'googlesitekit-api';
import {
	createRegistryControl,
	createRegistrySelector,
	commonActions,
	combineStores,
} from 'googlesitekit-data';
import { MODULES_ADSENSE } from './constants';
import { isValidAccountID } from '../util';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { extractExistingTag, getExistingTagURLs } from '../../../util/tag';
import adBlockingRecoveryTagMatcher from '../util/ad-blocking-recovery-tag-matcher';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createReducer } from '../../../googlesitekit/data/create-reducer';

// Actions
const FETCH_GET_EXISTING_AD_BLOCKING_RECOVERY_TAG =
	'FETCH_GET_EXISTING_AD_BLOCKING_RECOVERY_TAG';
const RECEIVE_GET_EXISTING_AD_BLOCKING_RECOVERY_TAG =
	'RECEIVE_GET_EXISTING_AD_BLOCKING_RECOVERY_TAG';

const fetchSyncAdBlockingRecoveryTagsStore = createFetchStore( {
	baseName: 'syncAdBlockingRecoveryTags',
	controlCallback: () => {
		return set( 'modules', 'adsense', 'sync-ad-blocking-recovery-tags' );
	},
} );

const initialState = {
	existingAdBlockingRecoveryTag: undefined,
};

const actions = {
	fetchGetExistingAdBlockingRecoveryTag() {
		return {
			payload: {},
			type: FETCH_GET_EXISTING_AD_BLOCKING_RECOVERY_TAG,
		};
	},
	receiveGetExistingAdBlockingRecoveryTag( existingAdBlockingRecoveryTag ) {
		invariant(
			existingAdBlockingRecoveryTag === null ||
				'string' === typeof existingAdBlockingRecoveryTag,
			'existingAdBlockingRecoveryTag must be a tag string or null.'
		);

		return {
			payload: {
				existingAdBlockingRecoveryTag: isValidAccountID(
					existingAdBlockingRecoveryTag
				)
					? existingAdBlockingRecoveryTag
					: null,
			},
			type: RECEIVE_GET_EXISTING_AD_BLOCKING_RECOVERY_TAG,
		};
	},
	/**
	 * Triggers an API request to sync Ad Blocking Recovery and Error Protection tags on the server.
	 *
	 * @since 1.104.0
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	syncAdBlockingRecoveryTags() {
		return fetchSyncAdBlockingRecoveryTagsStore.actions.fetchSyncAdBlockingRecoveryTags();
	},
};

const controls = {
	[ FETCH_GET_EXISTING_AD_BLOCKING_RECOVERY_TAG ]: createRegistryControl(
		( registry ) => async () => {
			const homeURL = registry.select( CORE_SITE ).getHomeURL();
			const existingTagURLs = await getExistingTagURLs( {
				homeURL,
			} );

			const { getHTMLForURL } = registry.resolveSelect( CORE_SITE );

			for ( const url of existingTagURLs ) {
				const html = await getHTMLForURL( url );
				const tagFound = extractExistingTag(
					html,
					adBlockingRecoveryTagMatcher
				);
				if ( tagFound ) {
					return tagFound;
				}
			}

			return null;
		}
	),
};

const reducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case RECEIVE_GET_EXISTING_AD_BLOCKING_RECOVERY_TAG: {
			const { existingAdBlockingRecoveryTag } = payload;

			return {
				...state,
				existingAdBlockingRecoveryTag,
			};
		}

		default: {
			return state;
		}
	}
} );

const resolvers = {
	*getExistingAdBlockingRecoveryTag() {
		const registry = yield commonActions.getRegistry();

		const existingAdBlockingRecoveryTag = registry
			.select( MODULES_ADSENSE )
			.getExistingAdBlockingRecoveryTag();

		if ( existingAdBlockingRecoveryTag === undefined ) {
			const fetchedAdBlockingRecoveryTag =
				yield actions.fetchGetExistingAdBlockingRecoveryTag();

			yield actions.receiveGetExistingAdBlockingRecoveryTag(
				fetchedAdBlockingRecoveryTag
			);
		}
	},
};

const selectors = {
	/**
	 * Gets the existing ad blocking recovery tag.
	 *
	 * @since 1.105.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} The existing ad blocking recovery tag `string` if present, `null` if not present, or `undefined` if not loaded yet.
	 */
	getExistingAdBlockingRecoveryTag( state ) {
		return state.existingAdBlockingRecoveryTag;
	},

	/**
	 * Checks whether or not an existing ad blocking recovery tag is present.
	 *
	 * @since 1.105.0
	 *
	 * @return {(boolean|undefined)} Boolean if ad blocking recovery tag is present, `undefined` if ad blocking recovery tag presence has not been resolved yet.
	 */
	hasExistingAdBlockingRecoveryTag: createRegistrySelector(
		( select ) => () => {
			const existingAdBlockingRecoveryTag =
				select( MODULES_ADSENSE ).getExistingAdBlockingRecoveryTag();

			if ( existingAdBlockingRecoveryTag === undefined ) {
				return undefined;
			}

			return !! existingAdBlockingRecoveryTag;
		}
	),
};

const store = combineStores( fetchSyncAdBlockingRecoveryTagsStore, {
	initialState,
	actions,
	reducer,
	controls,
	resolvers,
	selectors,
} );

export default store;
