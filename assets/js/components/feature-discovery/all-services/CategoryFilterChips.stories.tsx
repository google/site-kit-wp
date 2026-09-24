/**
 * CategoryFilterChips stories.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { useCategorySelection } from '@/js/components/feature-discovery/hooks/useCategorySelection';
import type { FeatureCategorySlug } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { Story } from '@/js/types/Story';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import CategoryFilterChips from './CategoryFilterChips';

interface TemplateProps {
	initialSelection?: FeatureCategorySlug[];
}

const Template: FC< TemplateProps > = ( { initialSelection = [] } ) => {
	const [ selectedCategories, onToggleCategory ] =
		useCategorySelection( initialSelection );

	return (
		<div className="googlesitekit-module-page googlesitekit-feature-discovery">
			<div className="googlesitekit-feature-discovery__content">
				<CategoryFilterChips
					onToggleCategory={ onToggleCategory }
					selectedCategories={ selectedCategories }
				/>
			</div>
		</div>
	);
};

export const AllServicesSelected = Template.bind( {} ) as Story;
AllServicesSelected.storyName = 'All Services Selected';
AllServicesSelected.scenario = {};

export const TwoCategoriesSelected = Template.bind( {} ) as Story;
TwoCategoriesSelected.storyName = 'Two Categories Selected';
TwoCategoriesSelected.args = {
	initialSelection: [ 'audience', 'monetization' ],
};
TwoCategoriesSelected.scenario = {};

export default {
	title: 'Components/Feature Discovery/CategoryFilterChips',
	component: CategoryFilterChips,
	parameters: { padding: 0 },
	decorators: [
		( StoryComponent: Story ) => {
			function setupRegistry() {
				// No registry setup needed for this static category list.
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<StoryComponent />
				</WithRegistrySetup>
			);
		},
	],
};
