/**
 * AdBlockerWarningWidget Component Stories.
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
import { provideModules } from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import AdSenseConnectCTAWidget from './AdSenseConnectCTAWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	'adSenseConnectCTA'
)( AdSenseConnectCTAWidget );

const Template = () => <WidgetWithComponentProps />;

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.scenario = {
	label: 'Global/AdSenseConnectCTAWidget/Ready',
	delay: 250,
};

export const ReadyNotConnected = Template.bind( {} );
ReadyNotConnected.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			provideModules( registry, [
				{
					active: true,
					connected: false,
					slug: 'adsense',
				},
			] );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
ReadyNotConnected.storyName = 'ReadyNotConnected';

export default {
	title: 'Modules/AdSense/Widgets/AdSenseConnectCTA',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: false,
						connected: false,
						slug: 'adsense',
					},
				] );
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
						{
							// eslint-disable-next-line jsx-a11y/anchor-has-content
							<a href="?page=googlesitekit-settings" />
						}
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
