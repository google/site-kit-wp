/**
 * KeyMetricsSetupCTAWidget Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
// import {
// 	provideGatheringDataState,
// 	provideModules,
// 	provideUserAuthentication,
// } from '../../../../tests/js/test-utils';
// import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
// import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';
// import KeyMetricsSetupCTAWidget from './KeyMetricsSetupCTAWidget';

// jest.resetModules();
global._googlesitekitModulesData = {
	'data_available_search-console': true,
	'data_available_analytics-4': true,
};

const WithRegistrySetup =
	require( '../../../../tests/js/WithRegistrySetup' ).default;
const {
	withWidgetComponentProps,
} = require( '../../googlesitekit/widgets/util' );
const KeyMetricsSetupCTAWidget =
	require( './KeyMetricsSetupCTAWidget' ).default;

const WidgetWithComponentProps = withWidgetComponentProps(
	'keyMetricsSetupCTA'
)( KeyMetricsSetupCTAWidget );

const {
	provideModules,
	provideUserAuthentication,
} = require( '../../../../tests/js/test-utils' );

const Template = () => <WidgetWithComponentProps />;

export const Default = Template.bind( {} );
Default.storyName = 'SetupCTAWidget';
Default.scenario = {
	label: 'KeyMetrics/SetupCTAWidget',
	delay: 250,
};
Default.parameters = {
	features: [ 'userInput' ],
};

export default {
	title: 'Key Metrics',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				global._googlesitekitUserData.isUserInputCompleted = false;
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );
				provideUserAuthentication( registry );
			};

			return (
				<div
					style={ {
						minHeight: '200px',
						display: 'flex',
						alignItems: 'center',
					} }
				>
					<div id="adminmenu">
						{ /* eslint-disable-next-line jsx-a11y/anchor-has-content */ }
						<a href="http://test.test/?page=googlesitekit-settings" />
					</div>
					<div style={ { flex: 1 } }>
						<WithRegistrySetup func={ setupRegistry }>
							<Story />
						</WithRegistrySetup>
					</div>
				</div>
			);
		},
	],
};
