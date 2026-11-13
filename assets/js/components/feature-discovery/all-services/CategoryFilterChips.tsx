/**
 * CategoryFilterChips component.
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
import { FC, useCallback } from 'react';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import {
	ChipMultiSelect,
	ChipMultiSelectItem,
} from '@/js/components/ChipMultiSelect';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORY_ANY,
	FEATURE_CATEGORY_CHIP_EVENT_LABELS,
	FEATURE_CATEGORY_CHIP_LABELS,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type {
	FeatureCategory,
	FeatureCategoryChipID,
	FeatureCategorySlug,
} from '@/js/googlesitekit/datastore/feature-discovery/types';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';

const NoCheckMark: FC = () => null;

interface CategoryFilterChipsProps {
	selectedCategories: FeatureCategorySlug[];
	onToggleCategory: ( categorySlug: FeatureCategorySlug | null ) => void;
}

const CategoryFilterChips: FC< CategoryFilterChipsProps > = ( {
	selectedCategories,
	onToggleCategory,
} ) => {
	const viewContext = useViewContext();

	const handleToggleChip = useCallback(
		( chipID: FeatureCategoryChipID, isSelected: boolean ) => {
			if ( isSelected ) {
				trackEvent(
					`${ viewContext }_all-services`,
					'select_category_filter',
					FEATURE_CATEGORY_CHIP_EVENT_LABELS[ chipID ]
				);
			}

			if ( chipID === FEATURE_CATEGORY_ANY ) {
				onToggleCategory( null );
				return;
			}

			onToggleCategory( chipID as FeatureCategorySlug );
		},
		[ onToggleCategory, viewContext ]
	);

	const categories = useSelect( ( select: Select ) => {
		return select( CORE_FEATURE_DISCOVERY ).getFeatureCategories();
	}, [] );

	return (
		<div className="googlesitekit-category-filter-chips">
			<ChipMultiSelect onToggleChip={ handleToggleChip }>
				<ChipMultiSelectItem
					id={ FEATURE_CATEGORY_ANY }
					selected={ selectedCategories.length === 0 }
					CheckMark={ NoCheckMark }
				>
					{ FEATURE_CATEGORY_CHIP_LABELS[ FEATURE_CATEGORY_ANY ] }
				</ChipMultiSelectItem>

				{ categories.map( ( category: FeatureCategory ) => (
					<ChipMultiSelectItem
						id={ category.slug }
						key={ category.slug }
						selected={ selectedCategories.includes(
							category.slug
						) }
						CheckMark={ NoCheckMark }
					>
						{ category.chipLabel }
					</ChipMultiSelectItem>
				) ) }
			</ChipMultiSelect>
		</div>
	);
};

export default CategoryFilterChips;
