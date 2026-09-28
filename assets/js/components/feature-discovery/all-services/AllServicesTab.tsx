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
import { FC, useState } from 'react';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
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
	const [ selectedCategories, setSelectedCategories ] = useState<
		FeatureCategorySlug[]
	>( [] );

	const goalGroups: GoalGroup[] = useSelect(
		( select: Select ) => {
			const { getFeatureCategories, getFeaturesFilteredByGoal } = select(
				CORE_FEATURE_DISCOVERY
			);

			return getFeatureCategories()
				.map( ( category: FeatureCategory ) => ( {
					category,
					features: getFeaturesFilteredByGoal(
						category.slug,
						selectedCategories
					),
				} ) )
				.filter( ( { features }: GoalGroup ) => features.length > 0 );
		},
		[ selectedCategories ]
	);

	function onToggleCategory( categorySlug: FeatureCategorySlug | null ) {
		if ( categorySlug === null ) {
			setSelectedCategories( [] );
			return;
		}

		setSelectedCategories( ( currentSelection ) => {
			if ( currentSelection.includes( categorySlug ) ) {
				return currentSelection.filter(
					( category ) => category !== categorySlug
				);
			}

			return [ ...currentSelection, categorySlug ];
		} );
	}

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
