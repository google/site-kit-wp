/**
 * Modules API.
 *
 * Provides API functions to manage modules.
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
import { createModuleStore } from './create-module-store';
import { STORE_NAME } from './datastore/constants';
// This import has a side-effect: it automatically registers the "core/modules"
// store on `googlesitekit.data`.
import './datastore';

const Modules = {
	createModuleStore,
	activateModule: ( ...args ) => {
		return Data.dispatch( STORE_NAME ).activateModule( ...args );
	},
	deactivateModule: ( ...args ) => {
		return Data.dispatch( STORE_NAME ).deactivateModule( ...args );
	},
};

export default Modules;
