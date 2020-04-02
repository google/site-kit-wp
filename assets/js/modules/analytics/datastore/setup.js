/**
 * modules/analytics data store: setup.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '.';
import {
	isValidAccountID,
	isValidPropertyID,
	isValidProfileID,
	isValidInternalWebPropertyID,
} from '../util';

const { createRegistrySelector } = Data;

export const INITIAL_STATE = {};
export const actions = {};
export const controls = {};
export const reducer = ( state ) => state;
export const resolvers = {};

export const selectors = {
	/**
	 * Checks if changes can be submitted.
	 */
	canSubmitChanges: createRegistrySelector( ( select ) => () => {
		/* eslint-disable @wordpress/no-unused-vars-before-return */
		const accountID = select( STORE_NAME ).getAccountID();
		const propertyID = select( STORE_NAME ).getPropertyID();
		const profileID = select( STORE_NAME ).getProfileID();
		const internalWebPropertyID = select( STORE_NAME ).getInternalWebPropertyID();
		const haveSettingsChanged = select( STORE_NAME ).haveSettingsChanged();
		const hasExistingTag = select( STORE_NAME ).hasExistingTag();
		const hasTagPermissions = select( STORE_NAME ).getTagPermission( propertyID );
		const isSavingSettings = select( STORE_NAME ).isDoingSaveSettings();
		/* eslint-enable @wordpress/no-unused-vars-before-return */

		if ( hasExistingTag && ! hasTagPermissions ) {
			return false;
		}

		const requiredFalsyValues = [
			isSavingSettings,
		];
		if ( requiredFalsyValues.some( Boolean ) ) {
			return false;
		}
		const requiredTruthyValues = [
			isValidAccountID( accountID ),
			isValidPropertyID( propertyID ),
			isValidProfileID( profileID ),
			isValidInternalWebPropertyID( internalWebPropertyID ),
			haveSettingsChanged,
		];
		if ( requiredTruthyValues.some( ( value ) => ! value ) ) {
			return false;
		}

		return true;
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

