/**
 * Search Console Settings stories.
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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { removeAllFilters, addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { SettingsMain as SearchConsoleSettings } from '../assets/js/modules/search-console/components/settings';
import { fillFilterWithComponent } from '../assets/js/util';
import { STORE_NAME } from '../assets/js/modules/search-console/datastore';
import createLegacySettingsWrapper from './utils/create-legacy-settings-wrapper';

function filterSearchConsoleSettings() {
	removeAllFilters( 'googlesitekit.ModuleSettingsDetails-search-console' );
	addFilter(
		'googlesitekit.ModuleSettingsDetails-search-console',
		'googlesitekit.SearchConsoleModuleSettingsDetails',
		fillFilterWithComponent( SearchConsoleSettings, {
			onSettingsPage: true,
		} )
	);
}

const completeModuleData = {
	...global._googlesitekitLegacyData.modules[ 'search-console' ],
	active: true,
	setupComplete: true,
};

const Settings = createLegacySettingsWrapper( 'search-console', SearchConsoleSettings );

storiesOf( 'Search Console Module/Settings', module )
	.add( 'View, closed', () => {
		filterSearchConsoleSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetSettings( {} );
		};

		return <Settings isOpen={ false } module={ completeModuleData } callback={ setupRegistry } />;
	} )
	.add( 'View, open with all settings', () => {
		filterSearchConsoleSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetSettings( {
				propertyID: 'http://example.com/',
			} );
		};

		return <Settings module={ completeModuleData } callback={ setupRegistry } />;
	} )
;
