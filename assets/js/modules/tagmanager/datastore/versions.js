/**
 * `modules/tagmanager` data store: versions.
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
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import {
	commonActions,
	combineStores,
	createRegistrySelector,
} from 'googlesitekit-data';
import { MODULES_TAGMANAGER } from './constants';
import {
	isValidAccountID,
	isValidInternalContainerID,
} from '../util/validation';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { isValidGoogleTagID } from '../../analytics-4/utils/validation';

const fetchGetLiveContainerVersionStore = createFetchStore( {
	baseName: 'getLiveContainerVersion',
	argsToParams: ( accountID, internalContainerID ) => {
		return { accountID, internalContainerID };
	},
	validateParams: ( { accountID, internalContainerID } = {} ) => {
		invariant(
			isValidAccountID( accountID ),
			'A valid accountID is required to fetch or receive a live container version.'
		);
		invariant(
			isValidInternalContainerID( internalContainerID ),
			'A valid internalContainerID is required to fetch or receive a live container version.'
		);
	},
	controlCallback: async ( { accountID, internalContainerID } ) => {
		try {
			return await get(
				'modules',
				'tagmanager',
				'live-container-version',
				{ accountID, internalContainerID },
				{ useCache: false }
			);
		} catch ( err ) {
			// If the container has no published version, it will error with a 404
			// and the message will be "Published container version not found".
			// If the user has no permission to access the container, the error is also a 404
			// with a different message. In this case or any other case, we want to display
			// the error message along with the option to retry, so we allow it to be thrown
			// but filter out the former case.
			if (
				404 === err.code &&
				err.message.includes( 'container version not found' )
			) {
				return null;
			}
			throw err;
		}
	},
	reducerCallback: (
		state,
		liveContainerVersion,
		{ accountID, internalContainerID }
	) => {
		return {
			...state,
			liveContainerVersions: {
				...state.liveContainerVersions,
				[ `${ accountID }::${ internalContainerID }` ]:
					liveContainerVersion,
			},
		};
	},
} );

const baseInitialState = {
	liveContainerVersions: {},
};

const baseResolvers = {
	*getLiveContainerVersion( accountID, internalContainerID ) {
		if (
			! isValidAccountID( accountID ) ||
			! isValidInternalContainerID( internalContainerID )
		) {
			return;
		}

		const { select } = yield commonActions.getRegistry();

		if (
			undefined ===
			select( MODULES_TAGMANAGER ).getLiveContainerVersion(
				accountID,
				internalContainerID
			)
		) {
			yield fetchGetLiveContainerVersionStore.actions.fetchGetLiveContainerVersion(
				accountID,
				internalContainerID
			);
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the first Google Tag object within the current live container for the given account and internal container ID.
	 *
	 * @since 1.121.0
	 *
	 * @param {Object} state               Data store's state.
	 * @param {string} accountID           Account ID the container belongs to.
	 * @param {string} internalContainerID Internal container ID to get the Analytics tag for.
	 * @return {(Object|null|undefined)} Live container Google tag object, `null` if none exists, or `undefined` if not loaded yet.
	 */
	getLiveContainerGoogleTag: createRegistrySelector(
		( select ) =>
			function ( state, accountID, internalContainerID ) {
				const liveContainerVersion = select(
					MODULES_TAGMANAGER
				).getLiveContainerVersion( accountID, internalContainerID );

				if ( liveContainerVersion === undefined ) {
					return undefined;
				}

				if ( liveContainerVersion?.tag ) {
					return (
						liveContainerVersion.tag.find(
							( { type } ) => type === 'googtag'
						) || null
					);
				}

				return null;
			}
	),

	/**
	 * Gets the first Google Tag ID within the live container for the given account and container ID.
	 *
	 * @since 1.121.0
	 *
	 * @param {Object} state               Data store's state.
	 * @param {string} accountID           Account ID the container belongs to.
	 * @param {string} internalContainerID Internal container ID to get the Analytics tag for.
	 * @return {(string|null|undefined)} Google Tag ID if present and valid, `null` if none exists or not valid, or `undefined` if not loaded yet.
	 */
	getLiveContainerGoogleTagID: createRegistrySelector(
		( select ) =>
			function ( state, accountID, internalContainerID ) {
				const googleTag = select(
					MODULES_TAGMANAGER
				).getLiveContainerGoogleTag( accountID, internalContainerID );

				if ( googleTag === undefined ) {
					return undefined;
				}

				if ( googleTag?.parameter ) {
					// Check if the tag ID is provided directly on the tag first.
					let tagID = googleTag.parameter.find(
						( { key } ) => key === 'tagId'
					)?.value;

					// If the tag ID is a variable, parse out the name and look up its value.
					if ( tagID?.startsWith( '{{' ) ) {
						tagID = tagID.replace( /(\{\{|\}\})/g, '' );
						const constantVariable = select(
							MODULES_TAGMANAGER
						).getLiveContainerVariable(
							accountID,
							internalContainerID,
							tagID
						);
						tagID = constantVariable?.parameter.find(
							( { key } ) => key === 'value'
						)?.value;
					}

					// Finally, check that whatever was found is a valid Google Tag ID.
					if ( isValidGoogleTagID( tagID ) ) {
						return tagID;
					}
				}

				return null;
			}
	),

	/**
	 * Gets a Google Tag ID, if any, for the currently selected GTM account and container.
	 *
	 * @since 1.121.0
	 *
	 * @return {(string|null|undefined)} Google Tag ID string, or `null` if none, or `undefined` if not fully loaded.
	 */
	getCurrentGTMGoogleTagID: createRegistrySelector(
		( select ) =>
			function () {
				const accountID = select( MODULES_TAGMANAGER ).getAccountID();

				if ( ! isValidAccountID( accountID ) ) {
					return null;
				}

				const internalContainerID =
					select( MODULES_TAGMANAGER ).getInternalContainerID();

				if ( ! isValidInternalContainerID( internalContainerID ) ) {
					return null;
				}

				return select( MODULES_TAGMANAGER ).getLiveContainerGoogleTagID(
					accountID,
					internalContainerID
				);
			}
	),

	/**
	 * Gets the live container variable object by the given name for the given account and container ID.
	 *
	 * @since 1.18.0
	 *
	 * @param {Object} state               Data store's state.
	 * @param {string} accountID           Account ID the container belongs to.
	 * @param {string} internalContainerID Internal container ID to get version for.
	 * @param {string} variableName        Variable name to retrive.
	 * @return {(Object|null|undefined)} Live container version object, `null` if none exists, or `undefined` if not loaded yet.
	 */
	getLiveContainerVariable: createRegistrySelector(
		( select ) =>
			function ( state, accountID, internalContainerID, variableName ) {
				const liveContainerVersion = select(
					MODULES_TAGMANAGER
				).getLiveContainerVersion( accountID, internalContainerID );

				if ( liveContainerVersion === undefined ) {
					return undefined;
				}

				if ( liveContainerVersion?.variable ) {
					return (
						liveContainerVersion.variable.find(
							( { name } ) => name === variableName
						) || null
					);
				}

				return null;
			}
	),

	/**
	 * Gets the live container version for the given account and container IDs.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state               Data store's state.
	 * @param {string} accountID           Account ID the container belongs to.
	 * @param {string} internalContainerID Internal container ID to get version for.
	 * @return {(Object|null|undefined)} Live container version object, `null` if none exists, or `undefined` if not loaded yet.
	 */
	getLiveContainerVersion( state, accountID, internalContainerID ) {
		return state.liveContainerVersions[
			`${ accountID }::${ internalContainerID }`
		];
	},

	/**
	 * Checks whether or not the live container version is being fetched for the given account and container IDs.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state               Data store's state.
	 * @param {string} accountID           Account ID the container belongs to.
	 * @param {string} internalContainerID Internal container ID to get version for.
	 * @return {(boolean|undefined)} True if the live container version is being fetched, otherwise false.
	 */
	isDoingGetLiveContainerVersion: createRegistrySelector(
		( select ) => ( state, accountID, internalContainerID ) => {
			return select(
				MODULES_TAGMANAGER
			).isFetchingGetLiveContainerVersion(
				accountID,
				internalContainerID
			);
		}
	),
};

const store = combineStores( fetchGetLiveContainerVersionStore, {
	initialState: baseInitialState,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
} = store;

export default store;
