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
 * Internal dependencies
 */
import { SettingsView } from '../assets/js/modules/search-console/components/settings';
import { STORE_NAME } from '../assets/js/modules/search-console/datastore/constants';
import { STORE_NAME as CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { createTestRegistry, provideUserAuthentication } from '../tests/js/utils';
import createLegacySettingsWrapper from './utils/create-legacy-settings-wrapper';

const Settings = createLegacySettingsWrapper( 'search-console' );

const defaultSettings = {
	propertyID: '',
};

storiesOf( 'Search Console Module/Settings', module )
	.addDecorator( ( storyFn ) => {
		const registry = createTestRegistry();
		registry.dispatch( CORE_MODULES ).registerModule( 'search-console', {
			settingsViewComponent: SettingsView,
		} );
		registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
		provideUserAuthentication( registry );

		return storyFn( registry );
	} )
	.add( 'View, closed', ( registry ) => {
		return <Settings isOpen={ false } registry={ registry } />;
	} )
	.add( 'View, open with all settings', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			propertyID: 'http://example.com/',
		} );

		return <Settings isOpen={ true } registry={ registry } />;
	} )
;
