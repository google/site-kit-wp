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
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type {
	Feature,
	FeatureCategory,
} from '@/js/googlesitekit/datastore/feature-discovery/types';
import FeatureGoalGroup from './FeatureGoalGroup';

interface GoalGroup {
	category: FeatureCategory;
	features: Feature[];
}

const AllServicesTab: FC = () => {
	// Which features a group lists, and in what order, is the selectors'
	// business. Only groups with nothing to list are dropped here.
	const goalGroups: GoalGroup[] = useSelect( ( select: Select ) => {
		const { getFeatureCategories, getFeaturesByGoal } = select(
			CORE_FEATURE_DISCOVERY
		);

		return getFeatureCategories()
			.map( ( category: FeatureCategory ) => ( {
				category,
				features: getFeaturesByGoal( category.slug ),
			} ) )
			.filter( ( { features }: GoalGroup ) => features.length > 0 );
	}, [] );

	return (
		<div className="googlesitekit-all-services-tab">
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
