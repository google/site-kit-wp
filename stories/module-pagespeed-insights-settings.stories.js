/**
 * PageSpeed Insights Settings stories.
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
import {
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
} from '../tests/js/utils';
import createLegacySettingsWrapper from './utils/create-legacy-settings-wrapper';

const Settings = createLegacySettingsWrapper( 'pagespeed-insights' );

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	provideModules( registry, [
		{
			slug: 'pagespeed-insights',
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );

	return <Story registry={ registry } />;
};

storiesOf( 'PageSpeed Insights Module/Settings', module )
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
			return (
				<Settings
					registry={ registry }
					route="/connected-services/pagespeed-insights"
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
			return (
				<Settings
					registry={ registry }
					route="/connected-services/pagespeed-insights/edit"
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	);
