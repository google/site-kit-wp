/**
 * Optimize Settings stories.
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
import { AMP_MODE_PRIMARY } from '../assets/js/googlesitekit/datastore/site/constants';
import { SettingsEdit, SettingsView } from '../assets/js/modules/optimize/components/settings';
import { STORE_NAME as CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { STORE_NAME as MODULES_ANALYTICS } from '../assets/js/modules/analytics/datastore/constants';
import { STORE_NAME } from '../assets/js/modules/optimize/datastore/constants';
import fixtures from '../assets/js/googlesitekit/modules/datastore/fixtures.json';
import { createTestRegistry, provideSiteInfo, provideModules } from '../tests/js/utils';
import createLegacySettingsWrapper from './utils/create-legacy-settings-wrapper';

const analyticsFixture = fixtures.filter( ( fixture ) => fixture.slug === 'analytics' );

const defaultSettings = {
	optimizeID: '',
	ampExperimentJSON: '',
	ownerID: 0,
};

const Settings = createLegacySettingsWrapper( 'optimize' );

storiesOf( 'Optimize Module/Settings', module )
	.addDecorator( ( storyFn ) => {
		const registry = createTestRegistry();
		registry.dispatch( CORE_MODULES ).registerModule( 'optimize', {
			settingsEditComponent: SettingsEdit,
			settingsViewComponent: SettingsView,
		} );
		registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
		provideModules( registry, [ {
			slug: 'optimize',
			active: true,
			connected: true,
		} ] );

		return storyFn( registry );
	} )
	.add( 'View, closed', ( registry ) => {
		return <Settings isOpen={ false } registry={ registry } />;
	} )
	.add( 'View, open with all settings', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			optimizeID: 'OPT-1234567',
		} );

		return <Settings isOpen={ true } registry={ registry } />;
	} )
	.add( 'Edit, open with all settings', ( registry ) => {
		registry.dispatch( CORE_MODULES ).receiveGetModules( analyticsFixture );
		registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );
		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			optimizeID: 'OPT-1234567',
			ampExperimentJSON: '{"experimentName":{"sticky":true,"variants":{"0":33.4,"1":33.3,"2":33.3}}}',
		} );

		return <Settings isOpen={ true } isEditing={ true } registry={ registry } />;
	} )
	.add( 'Edit, open with no optimize ID', ( registry ) => {
		registry.dispatch( CORE_MODULES ).receiveGetModules( analyticsFixture );
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );

		return <Settings isOpen={ true } isEditing={ true } registry={ registry } />;
	} )
	.add( 'Edit, open with all settings and AMP Experiment JSON Field', ( registry ) => {
		provideSiteInfo( registry, { ampMode: AMP_MODE_PRIMARY } );
		registry.dispatch( CORE_MODULES ).receiveGetModules( analyticsFixture );
		registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );
		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			optimizeID: 'OPT-1234567',
			ampExperimentJSON: '{"experimentName":{"sticky":true,"variants":{"0":33.4,"1":33.3,"2":33.3}}}',
		} );

		return <Settings isOpen={ true } isEditing={ true } registry={ registry } />;
	} )
;
