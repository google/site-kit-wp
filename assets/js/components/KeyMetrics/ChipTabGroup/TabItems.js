/**
 * TabItems component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import Chip from './Chip';
import CheckMark from '@/svg/icons/check-2.svg';
import StarFill from '@/svg/icons/star-fill.svg';
import Null from '@/js/components/Null';
import {
	KEY_METRICS_GROUP_CURRENT,
	KEY_METRICS_GROUP_SUGGESTED,
} from '@/js/components/KeyMetrics/constants';

const icons = {
	[ KEY_METRICS_GROUP_CURRENT.SLUG ]: CheckMark,
	[ KEY_METRICS_GROUP_SUGGESTED.SLUG ]: StarFill,
};

export default function TabItems( {
	containerRef,
	isMobileBreakpoint,
	chipItemRows,
	allGroups,
	isActive,
	onChipChange,
	selectedCounts,
	newlyDetectedMetrics,
	activeGroupIndex,
} ) {
	return (
		<div
			className="googlesitekit-chip-tab-group__tab-items"
			ref={ containerRef }
		>
			{ ! isMobileBreakpoint &&
				chipItemRows.map( ( row ) => (
					<div
						// To avoid using indexes, key is extracted from the first group
						// of each row and joined to the string "row-".
						key={ `row-${ row[ 0 ].SLUG }` }
						className="googlesitekit-chip-tab-group__tab-items-row"
					>
						{ row.map( ( group ) => (
							<Chip
								key={ group.SLUG }
								slug={ group.SLUG }
								label={ group.LABEL }
								hasNewBadge={
									!! newlyDetectedMetrics?.[ group.SLUG ]
								}
								isActive={ group.SLUG === isActive }
								onClick={ onChipChange }
								selectedCount={ selectedCounts[ group.SLUG ] }
							/>
						) ) }
					</div>
				) ) }
			{ isMobileBreakpoint && (
				<TabBar
					activeIndex={ activeGroupIndex }
					handleActiveIndexUpdate={ ( index ) =>
						onChipChange( null, index )
					}
				>
					{ allGroups.map( ( group, index ) => {
						const Icon = icons[ group.SLUG ] || Null;
						return (
							<Tab key={ index } aria-label={ group.LABEL }>
								<Icon
									width={ 12 }
									height={ 12 }
									className={ `googlesitekit-chip-tab-group__chip-item-svg googlesitekit-chip-tab-group__tab-item-mobile-svg googlesitekit-chip-tab-group__chip-item-svg__${ group.SLUG }` }
								/>
								{ group.LABEL }
								{ selectedCounts[ group.SLUG ] > 0 && (
									<span className="googlesitekit-chip-tab-group__chip-item-count">
										({ selectedCounts[ group.SLUG ] })
									</span>
								) }
								{ !! newlyDetectedMetrics?.[ group.SLUG ] && (
									<span className="googlesitekit-chip-tab-group__chip-item-new-dot" />
								) }
							</Tab>
						);
					} ) }
				</TabBar>
			) }
		</div>
	);
}

TabItems.propTypes = {
	containerRef: PropTypes.object,
	isMobileBreakpoint: PropTypes.bool,
	chipItemRows: PropTypes.array.isRequired,
	allGroups: PropTypes.array.isRequired,
	isActive: PropTypes.string.isRequired,
	onChipChange: PropTypes.func.isRequired,
	selectedCounts: PropTypes.object.isRequired,
	newlyDetectedMetrics: PropTypes.object.isRequired,
	activeGroupIndex: PropTypes.number.isRequired,
};
