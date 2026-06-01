/**
 * Site Goals Selection Panel Goal Type List component.
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
import { ChangeEvent, FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SelectionPanelItem } from '@/js/components/SelectionPanel';
import Typography from '@/js/components/Typography';
import {
	GoalDriverID,
	GoalDriverOption,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

export interface GoalTypeListProps {
	listID: string;
	options: GoalDriverOption[];
	selectedIDs: GoalDriverID[];
	onToggleDriver: ( driverID: GoalDriverID, isChecked: boolean ) => void;
}

const GoalTypeList: FC< GoalTypeListProps > = ( {
	listID,
	options,
	selectedIDs,
	onToggleDriver,
} ) => {
	const selectedSet = new Set( selectedIDs );

	return (
		<div className="googlesitekit-site-goals-selection-panel__subsection">
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
					) => onToggleDriver( option.id, event.target.checked ) }
				/>
			) ) }
		</div>
	);
};

export default GoalTypeList;
