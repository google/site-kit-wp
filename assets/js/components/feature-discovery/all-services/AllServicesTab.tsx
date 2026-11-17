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
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Notifications from '@/js/components/notifications/Notifications';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_HUB_OPENED_WITH_INTERACTION_SURVEY_TRIGGER_ID,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type {
	Feature,
	FeatureCategory,
	FeatureCategorySlug,
} from '@/js/googlesitekit/datastore/feature-discovery/types';
import {
	CORE_USER,
	SURVEY_TRIGGER_MAX_TTL,
} from '@/js/googlesitekit/datastore/user/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';
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

	const { triggerSurvey } = useDispatch( CORE_USER );

	function onToggleCategory( categorySlug: FeatureCategorySlug | null ) {
		if ( categorySlug === null ) {
			setSelectedCategories( [] );
			return;
		}

		// Only selecting a category counts as an interaction, so deselecting
		// one does not.
		if ( ! selectedCategories.includes( categorySlug ) ) {
			triggerSurvey(
				FEATURE_HUB_OPENED_WITH_INTERACTION_SURVEY_TRIGGER_ID,
				{ ttl: SURVEY_TRIGGER_MAX_TTL }
			);
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

			<div className="googlesitekit-all-services-tab__notifications">
				<Notifications
					areaSlug={
						NOTIFICATION_AREAS.FEATURE_DISCOVERY_ALL_SERVICES_TOP
					}
					groupID={ NOTIFICATION_GROUPS.DEFAULT }
				/>
			</div>

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
