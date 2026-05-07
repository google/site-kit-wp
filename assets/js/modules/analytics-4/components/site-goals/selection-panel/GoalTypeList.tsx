/**
 * Site Goals Selection Panel GoalTypeList component.
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
import classnames from 'classnames';
import type { ChangeEvent, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SelectionPanelItem } from '@/js/components/SelectionPanel';
import Typography from '@/js/components/Typography';
import type {
	GoalDriverID,
	GoalDriverOption,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import ChevronDownIcon from '@/svg/icons/chevron-down.svg';

interface GoalTypeListProps {
	listID: string;
	title: string;
	options: GoalDriverOption[];
	selectedIDs: GoalDriverID[];
	isExpanded: boolean;
	onToggleExpand: () => void;
	onToggleDriver: ( driverID: GoalDriverID, isChecked: boolean ) => void;
}

const GoalTypeList: FC< GoalTypeListProps > = ( {
	listID,
	title,
	options,
	selectedIDs,
	isExpanded,
	onToggleExpand,
	onToggleDriver,
} ) => {
	const selectedSet = useMemo(
		() => new Set( selectedIDs ),
		[ selectedIDs ]
	);

	return (
		<section className="googlesitekit-site-goals-selection-panel__section">
			<button
				type="button"
				className="googlesitekit-site-goals-selection-panel__section-toggle"
				onClick={ onToggleExpand }
				aria-expanded={ isExpanded }
				aria-controls={ `site-goals-selection-section-${ listID }` }
			>
				<span className="googlesitekit-site-goals-selection-panel__section-toggle-content">
					<ChevronDownIcon
						width={ 20 }
						height={ 20 }
						className={ classnames(
							'googlesitekit-site-goals-selection-panel__section-toggle-icon',
							{
								'googlesitekit-site-goals-selection-panel__section-toggle-icon--expanded':
									isExpanded,
							}
						) }
					/>
					<Typography
						as="span"
						type="title"
						size="large"
						className="googlesitekit-site-goals-selection-panel__section-title"
					>
						{ title }
					</Typography>
				</span>
			</button>

			{ isExpanded && (
				<div
					id={ `site-goals-selection-section-${ listID }` }
					className="googlesitekit-site-goals-selection-panel__items"
				>
					<Typography
						as="p"
						type="body"
						size="small"
						className="googlesitekit-site-goals-selection-panel__items-title"
					>
						{ __( 'Goal drivers', 'google-site-kit' ) }
					</Typography>

					{ options.map( ( option ) => (
						<SelectionPanelItem
							key={ option.id }
							id={ `site-goals-selection-${ option.id }-${ listID }` }
							slug={ option.id }
							title={ option.title }
							description={ option.description }
							isItemSelected={ selectedSet.has( option.id ) }
							onCheckboxChange={ (
								event: ChangeEvent< HTMLInputElement >
							) =>
								onToggleDriver(
									option.id,
									event.target.checked
								)
							}
						/>
					) ) }
				</div>
			) }
		</section>
	);
};

export default GoalTypeList;
