/**
 * `core/modules` data store changes
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
const { createRegistrySelector } = Data;

/**
 * External dependencies
 */
import invariant from 'invariant';

export const actions = {
	*submitChanges( slug ) {
		if ( slug === undefined || slug === '' ) {
			return { error: `missing slug to call submitChanges() action.` };
		}
		const registry = yield Data.commonActions.getRegistry();
		if ( !! registry.dispatch( `modules/${ slug }` ) && !! registry.dispatch( `modules/${ slug }` ).submitChanges ) {
			return registry.dispatch( `modules/${ slug }` ).submitChanges();
		}
		return { error: `'modules/${ slug }' does not have a submitChanges() action.` };
	},
};

export const selectors = {
	isDoingSubmitChanges: createRegistrySelector( ( select ) => ( state, slug ) => {
		invariant( slug, 'slug is required.' );
		return !! select( `modules/${ slug }` ) && !! select( `modules/${ slug }` ).isDoingSubmitChanges && select( `modules/${ slug }` ).isDoingSubmitChanges();
	} ),
	canSubmitChanges: createRegistrySelector( ( select ) => ( state, slug ) => {
		invariant( slug, 'slug is required.' );
		return !! select( `modules/${ slug }` ) && !! select( `modules/${ slug }` ).canSubmitChanges && select( `modules/${ slug }` ).canSubmitChanges();
	} ),

};

export default {
	actions,
	selectors,
};
