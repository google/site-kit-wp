/**
 * Provides API functions to create a datastore for a module.
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
import Data from 'googlesitekit-data';
import { createNotificationsStore } from '../data/create-notifications-store';
import {
	createSettingsStore,
	makeDefaultSubmitChanges,
	makeDefaultCanSubmitChanges,
	makeDefaultRollbackChanges,
} from '../data/create-settings-store';
import { createErrorStore } from '../data/create-error-store';
import { createInfoStore } from './create-info-store';
import { createSubmitChangesStore } from './create-submit-changes-store';
import { createValidationSelector } from '../data/utils';

/**
 * Creates a base store object for a Site Kit module.
 *
 * Every module that intends to register its own store must use this function
 * to get the base store. It can then combine the base module with its own
 * selectors and actions to individualize the store.
 *
 * The return object of this function also includes a `STORE_NAME` property,
 * the value of which must be used as the name when registering the store.
 *
 * @since 1.6.0
 *
 * @param {string}   slug                            Slug of the module that the store is for.
 * @param {Object}   args                            Arguments to consider for the store.
 * @param {number}   args.storeName                  Store name to use.
 * @param {Array}    [args.settingSlugs]             Optional. If the module store should support settings, this needs to be a list of the slugs that are part of the module and handled by the module's 'modules/{slug}/data/settings' API endpoint. Default is undefined.
 * @param {Array}    [args.ownedSettingsSlugs]       Optional. List of "owned settings" for this module, if they exist.
 * @param {Object}   [args.initialSettings]          Optional. An initial set of settings for the module as key-value pairs.
 * @param {boolean}  [args.requiresSetup]            Optional. Store flag for requires setup. Default is 'true'.
 * @param {Function} [args.submitChanges]            Optional. Submit settings changes handler.
 * @param {Function} [args.rollbackChanges]          Optional. Rollbacks settings changes handler.
 * @param {Function} [args.validateCanSubmitChanges] Optional. A function to validate whether module settings can be submitted.
 * @param {Function} [args.validateIsSetupBlocked]   Optional. A function to validate whether module setup is terminally blocked from continuing.
 * @return {Object} The base module store object, with additional `STORE_NAME` and
 *                  `initialState` properties.
 */
export function createModuleStore( slug, args = {} ) {
	const {
		storeName,
		settingSlugs,
		ownedSettingsSlugs = undefined,
		initialSettings = undefined,
		requiresSetup = true,
		submitChanges,
		rollbackChanges,
		validateCanSubmitChanges,
		validateIsSetupBlocked = undefined,
	} = args;

	invariant( slug, 'slug is required.' );
	invariant( storeName, 'storeName is required.' );

	const notificationsStore = createNotificationsStore(
		'modules',
		slug,
		'notifications',
		{
			storeName,
		}
	);

	const infoStore = createInfoStore( slug, {
		storeName,
		requiresSetup,
	} );

	const setupBlockedStore = {};
	if ( requiresSetup && validateIsSetupBlocked ) {
		const {
			safeSelector: isSetupBlocked,
			dangerousSelector: __dangerousIsSetupBlocked,
		} = createValidationSelector( validateIsSetupBlocked, {
			negate: true,
		} );
		setupBlockedStore.selectors = {
			isSetupBlocked,
			__dangerousIsSetupBlocked,
		};
	}

	let combinedStore = {};
	if ( 'undefined' !== typeof settingSlugs ) {
		const settingsStore = createSettingsStore(
			'modules',
			slug,
			'settings',
			{
				ownedSettingsSlugs,
				storeName,
				settingSlugs,
				initialSettings,
			}
		);

		const submitChangesStore = createSubmitChangesStore( {
			submitChanges:
				submitChanges || makeDefaultSubmitChanges( slug, storeName ),
			rollbackChanges:
				rollbackChanges || makeDefaultRollbackChanges( storeName ),
			validateCanSubmitChanges:
				validateCanSubmitChanges ||
				makeDefaultCanSubmitChanges( storeName ),
		} );

		// To prevent duplication errors during combining stores, we don't need to combine
		// Data.commonStore here since settingsStore already uses commonActions and commonControls
		// from the Data.commonStore.
		combinedStore = Data.combineStores(
			notificationsStore,
			settingsStore,
			submitChangesStore,
			infoStore,
			createErrorStore( storeName ),
			setupBlockedStore
		);
	} else {
		combinedStore = Data.combineStores(
			Data.commonStore,
			notificationsStore,
			infoStore,
			setupBlockedStore,
			createErrorStore( storeName ),
			createSubmitChangesStore( {
				submitChanges,
				validateCanSubmitChanges,
			} )
		);
	}

	combinedStore.STORE_NAME = storeName;

	return combinedStore;
}
