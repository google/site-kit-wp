/**
 * Admin Bar App Component Stories.
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
import {
	setupAnalyticsGatheringData,
	setupBaseRegistry,
	setupSearchConsoleGatheringData,
	setupSearchConsoleAnalyticsMockReports,
	setupSearchConsoleAnalyticsZeroData,
} from './common.stories';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import AdminBarApp from './AdminBarApp';

const Template = ( { setupRegistry = () => {}, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<AdminBarApp { ...args } />
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: setupSearchConsoleAnalyticsMockReports,
};
Ready.scenario = {
	label: 'Global/Admin Bar',
	readySelector: '.googlesitekit-data-block',
	delay: 250,
};

export const GatheringData = Template.bind( {} );
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	setupRegistry: ( registry ) => {
		setupSearchConsoleGatheringData( registry );
		setupAnalyticsGatheringData( registry );
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: setupSearchConsoleAnalyticsZeroData,
};

export default {
	title: 'Views/AdminBarApp/AdminBarApp',
	decorators: [
		( Story ) => (
			<div id="wpadminbar">
				<div className="googlesitekit-plugin">
					<div
						id="js-googlesitekit-adminbar"
						className="ab-sub-wrapper googlesitekit-adminbar"
						style={ { display: 'block' } }
					>
						<section
							id="js-googlesitekit-adminbar-modules"
							className="googlesitekit-adminbar-modules"
						>
							<Story />
						</section>
					</div>
				</div>
			</div>
		),
		( Story, { args } ) => {
			return (
				<WithRegistrySetup
					func={ ( registry ) => {
						setupBaseRegistry( registry, args );
					} }
				>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
