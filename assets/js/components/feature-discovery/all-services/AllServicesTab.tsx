/**
 * AllServicesTab component.
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
import { Select, useSelect } from 'googlesitekit-data';
import { useCategorySelection } from '@/js/components/feature-discovery/hooks/useCategorySelection';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type {
	Feature,
	FeatureCategory,
	FeatureCategorySlug,
} from '@/js/googlesitekit/datastore/feature-discovery/types';
import CategoryFilterChips from './CategoryFilterChips';
import FeatureGoalGroup from './FeatureGoalGroup';

interface GoalGroup {
	category: FeatureCategory;
	features: Feature[];
}

const AllServicesTab: FC = () => {
	const [ selectedCategories, onToggleCategory ] = useCategorySelection();

	const goalGroups: GoalGroup[] = useSelect(
		( select: Select ) => {
			const { getFeatureCategories, getAvailableFeatures } = select(
				CORE_FEATURE_DISCOVERY
			);
			const categories = getFeatureCategories();
			const selectedCategorySet = new Set( selectedCategories );
			const groupedFeatures: Record< FeatureCategorySlug, Feature[] > =
				Object.fromEntries(
					categories.map( ( category: FeatureCategory ) => [
						category.slug,
						[],
					] )
				) as Record< FeatureCategorySlug, Feature[] >;

			getAvailableFeatures().forEach( ( feature: Feature ) => {
				const goalCategory = selectedCategories.length
					? feature.goalCategories.find(
							( category: FeatureCategorySlug ) =>
								selectedCategorySet.has( category )
					  )
					: feature.goalCategories[ 0 ];

				if ( ! goalCategory ) {
					return;
				}

				groupedFeatures[ goalCategory ].push( feature );
			} );

			return categories
				.filter( ( category: FeatureCategory ) => {
					if (
						selectedCategorySet.size > 0 &&
						! selectedCategorySet.has( category.slug )
					) {
						return false;
					}

					return groupedFeatures[ category.slug ].length > 0;
				} )
				.map( ( category: FeatureCategory ) => ( {
					category,
					features: groupedFeatures[ category.slug ],
				} ) );
		},
		[ selectedCategories ]
	);

	return (
		<div className="googlesitekit-all-services-tab">
			<CategoryFilterChips
				onToggleCategory={ onToggleCategory }
				selectedCategories={ selectedCategories }
			/>

			{ goalGroups.map( ( { category, features } ) => (
				<FeatureGoalGroup
					category={ category }
					features={ features }
					key={ category.slug }
				/>
			) ) }
		</div>
	);
};

export default AllServicesTab;
