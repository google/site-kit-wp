/**
 * Idea Hub DashboardCTA component stories.
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

/**
 * Internal dependencies
 */
import { createTestRegistry, WithTestRegistry, provideModules } from '../../../../../../../tests/js/utils';
import DashboardCTA from './index';

const Template = ( args ) => <DashboardCTA { ...args } />;

export const DefaultDashboardCTA = Template.bind( {} );
DefaultDashboardCTA.storyName = 'Default';
DefaultDashboardCTA.decorators = [
	( Story ) => {
		const registry = createTestRegistry();
		provideModules( registry, [ {
			slug: 'idea-hub',
			active: false,
			connected: false,
		} ] );

		return (
			<WithTestRegistry registry={ registry } features={ [ 'ideaHubModule' ] }>
				<Story />
			</WithTestRegistry>
		);
	},
];

export const ActiveNotConnected = Template.bind( {} );
ActiveNotConnected.storyName = 'Active, not connected';
ActiveNotConnected.decorators = [
	( Story ) => {
		const registry = createTestRegistry();
		provideModules( registry, [ {
			slug: 'idea-hub',
			active: true,
			connected: false,
		} ] );

		return (
			<WithTestRegistry registry={ registry } features={ [ 'ideaHubModule' ] }>
				<Story />
			</WithTestRegistry>
		);
	},
];

export default {
	title: 'Modules/Idea Hub/components/dashboard/DashboardCTA',
	component: DashboardCTA,
};
