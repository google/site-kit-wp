/**
 * ActivateAnalyticsCTA Component Stories.
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
import {
	createTestRegistry,
	WithTestRegistry,
	provideModules,
} from '../../../../../../../tests/js/utils';
import Widget from '../../../../../googlesitekit/widgets/components/Widget';
import ActivateAnalyticsCTA from './ActivateAnalyticsCTA';

const Template = ( args ) => <ActivateAnalyticsCTA { ...args } />;

export const DefaultActivateAnalyticsCTA = Template.bind( {} );
DefaultActivateAnalyticsCTA.storyName = 'ActivateAnalyticsCTA';

export default {
	title:
		'Modules/SearchConsole/Widgets/SearchFunnelWidget/CTAs/ActivateAnalyticsCTA',
	component: ActivateAnalyticsCTA,
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();
			provideModules( registry );

			return (
				<WithTestRegistry registry={ registry }>
					<Widget widgetSlug="searchFunnel">
						<Story />
					</Widget>
				</WithTestRegistry>
			);
		},
	],
};
