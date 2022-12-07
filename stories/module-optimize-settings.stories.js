/**
 * Optimize Settings stories.
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
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import { AMP_MODE_PRIMARY } from '../assets/js/googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS } from '../assets/js/modules/analytics/datastore/constants';
import { MODULES_OPTIMIZE } from '../assets/js/modules/optimize/datastore/constants';
import {
	createTestRegistry,
	provideSiteInfo,
	provideModules,
	provideModuleRegistrations,
	provideUserAuthentication,
} from '../tests/js/utils';
import createLegacySettingsWrapper from './utils/create-legacy-settings-wrapper';

const defaultSettings = {
	optimizeID: '',
	ampExperimentJSON: '',
	ownerID: 0,
	placeAntiFlickerSnippet: false,
};

const Settings = createLegacySettingsWrapper( 'optimize' );

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	registry.dispatch( MODULES_OPTIMIZE ).receiveGetSettings( {} );

	provideModules( registry, [
		{
			slug: 'optimize',
			active: true,
			connected: true,
		},
		{
			slug: 'analytics',
			active: true,
			connected: true,
		},
	] );

	provideModuleRegistrations( registry );
	provideUserAuthentication( registry );

	return <Story registry={ registry } />;
};

storiesOf( 'Optimize Module/Settings', module )
	.add(
		'View, closed',
		( args, { registry } ) => {
			return (
				<Settings registry={ registry } route="/connected-services" />
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'View, open with all settings',
		( args, { registry } ) => {
			registry.dispatch( MODULES_OPTIMIZE ).receiveGetSettings( {
				...defaultSettings,
				optimizeID: 'OPT-1234567',
			} );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/optimize"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, open with all settings',
		( args, { registry } ) => {
			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );
			registry.dispatch( MODULES_OPTIMIZE ).receiveGetSettings( {
				...defaultSettings,
				optimizeID: 'OPT-1234567',
				ampExperimentJSON:
					'{"experimentName":{"sticky":true,"variants":{"0":33.4,"1":33.3,"2":33.3}}}',
			} );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/optimize/edit"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, open with no Optimize Container ID',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_OPTIMIZE )
				.receiveGetSettings( defaultSettings );
			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/optimize/edit"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, open with all settings and AMP Experiment JSON Field',
		( args, { registry } ) => {
			provideSiteInfo( registry, { ampMode: AMP_MODE_PRIMARY } );
			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );
			registry.dispatch( MODULES_OPTIMIZE ).receiveGetSettings( {
				...defaultSettings,
				optimizeID: 'OPT-1234567',
				ampExperimentJSON:
					'{"experimentName":{"sticky":true,"variants":{"0":33.4,"1":33.3,"2":33.3}}}',
			} );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/optimize/edit"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	);
