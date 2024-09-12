/**
 * `core/user` data store: dismissed prompts
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { get, set } from 'googlesitekit-api';
import {
	createRegistrySelector,
	commonActions,
	combineStores,
} from 'googlesitekit-data';
import { CORE_USER } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';
import { createValidatedAction } from '../../data/utils';

const { getRegistry } = commonActions;

function reducerCallback( state, dismissedPrompts ) {
	return {
		...state,
		dismissedPrompts:
			typeof dismissedPrompts === 'object' ? dismissedPrompts : {},
	};
}

const fetchGetDismissedPromptsStore = createFetchStore( {
	baseName: 'getDismissedPrompts',
	controlCallback: () =>
		get( 'core', 'user', 'dismissed-prompts', {}, { useCache: false } ),
	reducerCallback,
} );

const fetchDismissPromptStore = createFetchStore( {
	baseName: 'dismissPrompt',
	controlCallback: ( { slug, expiresInSeconds } ) =>
		set( 'core', 'user', 'dismiss-prompt', {
			slug,
			expiration: expiresInSeconds,
		} ),
	reducerCallback,
	argsToParams: ( slug, expiresInSeconds = 0 ) => {
		return { slug, expiresInSeconds };
	},
	validateParams: ( { slug, expiresInSeconds } = {} ) => {
		invariant( slug, 'slug is required.' );
		invariant(
			Number.isInteger( expiresInSeconds ),
			'expiresInSeconds must be an integer.'
		);
	},
} );

const baseInitialState = {
	dismissedPrompts: undefined,
};

const baseActions = {
	/**
	 * Dismisses the given prompt by slug.
	 *
	 * @since 1.121.0
	 *
	 * @param {string} slug                       Prompt slug to dismiss.
	 * @param {Object} options                    Dismiss prompt options.
	 * @param {number} [options.expiresInSeconds] Optional. An integer number of seconds for expiry. 0 denotes permanent dismissal.
	 * @return {Object} Generator instance.
	 */
	dismissPrompt: createValidatedAction(
		( slug, options = {} ) => {
			const { expiresInSeconds = 0 } = options;
			invariant( slug, 'A tour slug is required to dismiss a tour.' );
			invariant(
				Number.isInteger( expiresInSeconds ),
				'expiresInSeconds must be an integer.'
			);
		},
		function* ( slug, options = {} ) {
			const { expiresInSeconds = 0 } = options;

			return yield fetchDismissPromptStore.actions.fetchDismissPrompt(
				slug,
				expiresInSeconds
			);
		}
	),
};

const baseResolvers = {
	*getDismissedPrompts() {
		const { select } = yield getRegistry();
		const dismissedPrompts = select( CORE_USER ).getDismissedPrompts();

		if ( dismissedPrompts === undefined ) {
			yield fetchGetDismissedPromptsStore.actions.fetchGetDismissedPrompts();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the list of dismissed prompts.
	 *
	 * @since 1.121.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string[]|undefined)} Array of dismissed prompt keys, `undefined` if there are none.
	 */
	getDismissedPrompts( state ) {
		if ( state.dismissedPrompts === undefined ) {
			return undefined;
		}

		// We shouldn't use the getReferenceDate selector here because it returns date only
		// while we need the current time as well to properly determine whether the prompt is
		// expired or not.
		const currentTimeInSeconds = Math.floor( Date.now() / 1000 ); // eslint-disable-line sitekit/no-direct-date
		return Object.entries( state.dismissedPrompts ).reduce(
			( acc, [ slug, { expires } ] ) => {
				if ( expires === 0 || expires > currentTimeInSeconds ) {
					acc.push( slug );
				}
				return acc;
			},
			[]
		);
	},

	/**
	 * Gets the count of a dismissed prompt.
	 *
	 * @since 1.121.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Prompt slug.
	 * @return {(number|undefined)} Count of the prompt, `undefined` if there are none.
	 */
	getPromptDismissCount: createRegistrySelector( () => ( state, slug ) => {
		if ( ! state.dismissedPrompts ) {
			return undefined;
		}

		return state.dismissedPrompts[ slug ]?.count || 0;
	} ),

	/**
	 * Determines whether the prompt is dismissed or not.
	 *
	 * @since 1.121.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Prompt slug.
	 * @return {(boolean|undefined)} TRUE if dismissed, otherwise FALSE, `undefined` if not resolved yet.
	 */
	isPromptDismissed: createRegistrySelector(
		( select ) => ( state, slug ) => {
			return select( CORE_USER ).getDismissedPrompts()?.includes( slug );
		}
	),

	/**
	 * Checks whether or not the prompt is being dismissed for the given slug.
	 *
	 * @since 1.121.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Prompt slug.
	 * @return {boolean} True if the prompt is being dismissed, otherwise false.
	 */
	isDismissingPrompt: createRegistrySelector(
		( select ) => ( state, slug ) => {
			return select( CORE_USER ).isFetchingDismissPrompt( slug );
		}
	),
};

export const {
	actions,
	controls,
	initialState,
	reducer,
	resolvers,
	selectors,
} = combineStores(
	{
		initialState: baseInitialState,
		actions: baseActions,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	},
	fetchDismissPromptStore,
	fetchGetDismissedPromptsStore
);

export default {
	actions,
	controls,
	initialState,
	reducer,
	resolvers,
	selectors,
};
