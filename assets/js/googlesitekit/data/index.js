/**
 * Site Kit @wordpress/data (eg Redux-style) data store.
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
 * WordPress dependencies
 */
import {
	controls as wpControls,
	createRegistry,
	createRegistryControl,
	createRegistrySelector,
	useSelect,
	useDispatch,
	useRegistry,
	withSelect,
	withDispatch,
	RegistryProvider,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useInViewSelect } from '../../hooks/useInViewSelect';
import {
	combineStores,
	commonActions,
	commonControls,
	commonStore,
} from './utils';
import { createReducer } from './create-reducer';

/**
 * The Site Kit data registry.
 *
 * This should not be imported directly outside of `googlesitekit-*` files
 * that need access to the registry to register datastores/widgets/etc.
 *
 * Instead, use the exported functions (eg `useSelect`,
 * `createRegistrySelector`, etc.) from the `googlesitekit-data` package to
 * access parts of the registry.
 *
 * @since 1.3.0 Data registry introduced.
 * @since 1.130.0 Deprecated for general use in favor of named exports from `googlesitekit-data` package.
 * @deprecated
 */
const Data = createRegistry( {}, global.wp?.data );

// Attach some of our utility functions to the registry so third-party
// developers can use them.
Data.combineStores = combineStores;
Data.commonActions = commonActions;
Data.commonControls = commonControls;
Data.commonStore = commonStore;
Data.createReducer = createReducer;

// Attach our custom, useInViewSelect hook to the registry so third-party
// developers can use it.
Data.useInViewSelect = useInViewSelect;

// Attach some WordPress data functions to the registry so third-party
// developers can use them without importing '@wordpress/data'.
Data.createRegistryControl = createRegistryControl;
Data.createRegistrySelector = createRegistrySelector;
Data.useSelect = useSelect;
Data.useDispatch = useDispatch;
Data.useRegistry = useRegistry;
Data.withSelect = withSelect;
Data.withDispatch = withDispatch;
Data.wpControls = wpControls;
Data.RegistryProvider = RegistryProvider;

export {
	combineStores,
	commonActions,
	commonControls,
	commonStore,
	createReducer,
	useInViewSelect,
	createRegistryControl,
	createRegistrySelector,
	useSelect,
	useDispatch,
	useRegistry,
	withSelect,
	withDispatch,
	wpControls,
	RegistryProvider,
};

export default Data;
