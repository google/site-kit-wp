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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import {
	ChipMultiSelect,
	ChipMultiSelectItem,
} from '@/js/components/ChipMultiSelect';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type {
	FeatureCategory,
	FeatureCategorySlug,
} from '@/js/googlesitekit/datastore/feature-discovery/types';

const ALL_SERVICES_CHIP_ID = 'all-services';

const NoCheckMark: FC = () => null;

interface CategoryFilterChipsProps {
	selectedCategories: FeatureCategorySlug[];
	onToggleCategory: ( categorySlug: FeatureCategorySlug | null ) => void;
}

const CategoryFilterChips: FC< CategoryFilterChipsProps > = ( {
	selectedCategories,
	onToggleCategory,
} ) => {
	function handleToggleChip( ...args: unknown[] ) {
		const chipID = args[ 0 ];

		if ( chipID === ALL_SERVICES_CHIP_ID ) {
			onToggleCategory( null );
			return;
		}

		if ( typeof chipID === 'string' ) {
			onToggleCategory( chipID as FeatureCategorySlug );
		}
	}

	const categories = useSelect( ( select: Select ) => {
		return select( CORE_FEATURE_DISCOVERY ).getFeatureCategories();
	}, [] );

	return (
		<div className="googlesitekit-category-filter-chips">
			<ChipMultiSelect onToggleChip={ handleToggleChip }>
				<ChipMultiSelectItem
					id={ ALL_SERVICES_CHIP_ID }
					selected={ selectedCategories.length === 0 }
					CheckMark={ NoCheckMark }
				>
					{ __( 'All services', 'google-site-kit' ) }
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
