/**
 * Search Console module initialization.
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
 * Internal dependencies
 */
import { SettingsEdit, SettingsView } from './components/settings';
import SearchConsoleIcon from '@/svg/graphics/search-console.svg';
import { MODULES_SEARCH_CONSOLE } from './datastore/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from './constants';

export { registerStore } from './datastore';
export { registerWidgets } from './widgets';

export function registerModule( modules ) {
	modules.registerModule( MODULE_SLUG_SEARCH_CONSOLE, {
		storeName: MODULES_SEARCH_CONSOLE,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		Icon: SearchConsoleIcon,
	} );
}
