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
 * Internal dependencies
 */
import { provideModules } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util/get-widget-component-props';
import DashboardCTA from './DashboardCTA';

const WidgetWithComponentProps = withWidgetComponentProps( 'idea-hub' )( DashboardCTA );

const Template = ( { setupRegistry, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<WidgetWithComponentProps { ...args } />
	</WithRegistrySetup>
);

export const DefaultDashboardCTA = Template.bind( {} );
DefaultDashboardCTA.storyName = 'Default';
DefaultDashboardCTA.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [ {
			active: true,
			connected: true,
			slug: 'idea-hub',
		} ] );
	},
};

export const ActiveNotConnected = Template.bind( {} );
ActiveNotConnected.storyName = 'Active, not connected';
ActiveNotConnected.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [ {
			active: true,
			connected: false,
			slug: 'idea-hub',
		} ] );
	},
};

export default {
	title: 'Modules/Idea Hub/Components/dashboard/DashboardCTA',
	parameters: {
		features: [ 'ideaHubModule' ],
	},
};
