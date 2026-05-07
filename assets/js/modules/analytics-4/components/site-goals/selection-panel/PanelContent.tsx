/**
 * Site Goals Selection Panel Content component.
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
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import {
	GOAL_TYPES,
	getGoalDriverOptions,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import {
	SITE_GOALS_SELECTED_DRIVERS,
	SITE_GOALS_SELECTION_FORM,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import GoalTypeList from '@/js/modules/analytics-4/components/site-goals/selection-panel/GoalTypeList';
import type {
	GoalDriverID,
	GoalDriverSelectionState,
	GoalType,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { SelectionPanelContent } from '@/js/components/SelectionPanel';
import useFormValue from '@/js/hooks/useFormValue';

interface PanelContentProps {
	hasEcommerceGoalDrivers: boolean;
	hasLeadGoalDrivers: boolean;
}

const PanelContent: FC< PanelContentProps > = ( {
	hasEcommerceGoalDrivers,
	hasLeadGoalDrivers,
} ) => {
	const selectedDrivers = useFormValue(
		SITE_GOALS_SELECTION_FORM,
		SITE_GOALS_SELECTED_DRIVERS
	) as GoalDriverSelectionState;

	const { setValues } = useDispatch( CORE_FORMS );

	const ecommerceOptions = useMemo(
		() => getGoalDriverOptions( GOAL_TYPES.ECOMMERCE ),
		[]
	);
	const leadOptions = useMemo(
		() => getGoalDriverOptions( GOAL_TYPES.LEAD ),
		[]
	);

	const [ isEcommerceExpanded, setIsEcommerceExpanded ] = useState( true );
	const [ isLeadExpanded, setIsLeadExpanded ] = useState( true );

	const onToggleDriver = useCallback(
		( goalType: GoalType, driverID: GoalDriverID, isChecked: boolean ) => {
			const currentDriverIDs = selectedDrivers?.[ goalType ] || [];

			let nextDriverIDs = currentDriverIDs;

			if ( isChecked ) {
				if ( ! currentDriverIDs.includes( driverID ) ) {
					nextDriverIDs = currentDriverIDs.concat( driverID );
				}
			} else {
				nextDriverIDs = currentDriverIDs.filter(
					( currentDriverID ) => currentDriverID !== driverID
				);
			}

			setValues( SITE_GOALS_SELECTION_FORM, {
				[ SITE_GOALS_SELECTED_DRIVERS ]: {
					...selectedDrivers,
					[ goalType ]: nextDriverIDs,
				},
			} );
		},
		[ selectedDrivers, setValues ]
	);

	return (
		<SelectionPanelContent className="googlesitekit-site-goals-selection-panel__content">
			{ hasEcommerceGoalDrivers && (
				<GoalTypeList
					listID={ GOAL_TYPES.ECOMMERCE }
					title={ __(
						'Online store performance',
						'google-site-kit'
					) }
					options={ ecommerceOptions }
					selectedIDs={
						selectedDrivers?.[ GOAL_TYPES.ECOMMERCE ] || []
					}
					isExpanded={ isEcommerceExpanded }
					onToggleExpand={ () =>
						setIsEcommerceExpanded(
							( previousState ) => ! previousState
						)
					}
					onToggleDriver={ ( driverID, isChecked ) =>
						onToggleDriver(
							GOAL_TYPES.ECOMMERCE,
							driverID,
							isChecked
						)
					}
				/>
			) }

			{ hasLeadGoalDrivers && (
				<GoalTypeList
					listID={ GOAL_TYPES.LEAD }
					title={ __(
						'Lead generation performance',
						'google-site-kit'
					) }
					options={ leadOptions }
					selectedIDs={ selectedDrivers?.[ GOAL_TYPES.LEAD ] || [] }
					isExpanded={ isLeadExpanded }
					onToggleExpand={ () =>
						setIsLeadExpanded(
							( previousState ) => ! previousState
						)
					}
					onToggleDriver={ ( driverID, isChecked ) =>
						onToggleDriver( GOAL_TYPES.LEAD, driverID, isChecked )
					}
				/>
			) }
		</SelectionPanelContent>
	);
};

export default PanelContent;
