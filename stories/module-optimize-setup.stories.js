/**
 * Optimize Setup stories.
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
import ModuleSetup from '../assets/js/components/setup/ModuleSetup';
import { CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS } from '../assets/js/modules/analytics/datastore/constants';
import { MODULES_OPTIMIZE } from '../assets/js/modules/optimize/datastore/constants';
import {
	WithTestRegistry,
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
} from '../tests/js/utils';

function Setup( props ) {
	return (
		<WithTestRegistry { ...props }>
			<ModuleSetup moduleSlug="optimize" />
		</WithTestRegistry>
	);
}

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	provideModules( registry, [
		{
			slug: 'analytics',
			active: true,
			connected: true,
		},
		{
			slug: 'optimize',
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );

	return <Story registry={ registry } />;
};

storiesOf( 'Optimize Module/Setup', module )
	.add(
		'Start',
		( args, { registry } ) => {
			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );
			registry.dispatch( MODULES_OPTIMIZE ).receiveGetSettings( {} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Start with AMP Experiment JSON Field',
		( args, { registry } ) => {
			registry
				.dispatch( CORE_SITE )
				.receiveSiteInfo( { ampMode: 'standard' } );
			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );
			registry.dispatch( MODULES_OPTIMIZE ).receiveGetSettings( {} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Start with invalid values',
		( args, { registry } ) => {
			registry
				.dispatch( CORE_SITE )
				.receiveSiteInfo( { ampMode: 'standard' } );
			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );
			registry.dispatch( MODULES_OPTIMIZE ).receiveGetSettings( {
				optimizeID: '1234567',
				ampExperimentJSON: 'invalid AMP experiment',
			} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	);
