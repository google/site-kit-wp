/**
 * `modules/adsense` data store: Ad Blocking Recovery Existing Tag.
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
import Data from 'googlesitekit-data';
import { MODULES_ADSENSE } from './constants';
import { isValidAccountID } from '../util';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { extractExistingTag, getExistingTagURLs } from '../../../util/tag';
import adBlockingRecoveryTagMatcher from '../util/ad-blocking-recovery-tag-matcher';
import { createReducer } from '../../../googlesitekit/data/create-reducer';

const { createRegistryControl, createRegistrySelector } = Data;

// Actions
const FETCH_GET_EXISTING_AD_BLOCKING_RECOVERY_TAG =
	'FETCH_GET_EXISTING_AD_BLOCKING_RECOVERY_TAG';
const RECEIVE_GET_EXISTING_AD_BLOCKING_RECOVERY_TAG =
	'RECEIVE_GET_EXISTING_AD_BLOCKING_RECOVERY_TAG';

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
};

const controls = {
	[ FETCH_GET_EXISTING_AD_BLOCKING_RECOVERY_TAG ]: createRegistryControl(
		( registry ) => async () => {
			const homeURL = registry.select( CORE_SITE ).getHomeURL();
			const existingTagURLs = await getExistingTagURLs( {
				homeURL,
			} );

			for ( const url of existingTagURLs ) {
				await registry.dispatch( CORE_SITE ).waitForHTMLForURL( url );
				const html = registry.select( CORE_SITE ).getHTMLForURL( url );
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
		const registry = yield Data.commonActions.getRegistry();

		const existingAdBlockingRecoveryTag = registry
			.select( MODULES_ADSENSE )
			.getExistingAdBlockingRecoveryTag();

		if ( existingAdBlockingRecoveryTag === undefined ) {
			const fetchedAdBlockingRecoveryTag =
				yield actions.fetchGetExistingAdBlockingRecoveryTag();

			yield registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingAdBlockingRecoveryTag(
					fetchedAdBlockingRecoveryTag
				);
		}
	},
};

const selectors = {
	/**
	 * Gets the existing ad blocking recovery tag.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
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

const store = Data.combineStores( {
	initialState,
	actions,
	reducer,
	controls,
	resolvers,
	selectors,
} );

export default store;
