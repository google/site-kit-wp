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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { SelectionPanelContent } from '@/js/components/SelectionPanel';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import useFormValue from '@/js/hooks/useFormValue';
import {
	SITE_GOALS_SELECTED_DRIVERS,
	SITE_GOALS_SELECTION_FORM,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import {
	GOAL_TYPES,
	getGoalDriverOptions,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import {
	GoalDriverID,
	GoalDriverSelectionState,
	GoalType,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { getSelectedDriverIDs } from '@/js/modules/analytics-4/components/site-goals/utils/selectedDrivers';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import GoalTypeList from './GoalTypeList';
import GoalTypeSection from './GoalTypeSection';
import PrimaryActionRow from './PrimaryActionRow';
import VisitorEngagementEventList from './VisitorEngagementEventList';

interface PanelContentProps {
	hasEcommerceGoalDrivers: boolean;
	hasLeadGoalDrivers: boolean;
}

const PanelContent: FC< PanelContentProps > = ( {
	hasEcommerceGoalDrivers,
	hasLeadGoalDrivers,
} ) => {
	const [ selectedDrivers ] = useFormValue(
		SITE_GOALS_SELECTION_FORM,
		SITE_GOALS_SELECTED_DRIVERS
	);
	const selectedDriverState = selectedDrivers as
		| GoalDriverSelectionState
		| undefined;

	const { setValues } = useDispatch( CORE_FORMS );

	const ecommerceOptions = getGoalDriverOptions( GOAL_TYPES.ECOMMERCE );
	const leadOptions = getGoalDriverOptions( GOAL_TYPES.LEAD );

	const [ isEcommerceExpanded, setIsEcommerceExpanded ] = useState( true );
	const [ isLeadExpanded, setIsLeadExpanded ] = useState( true );

	const primaryEcommerceEvent = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getPrimaryEcommerceEvent(),
		[]
	);
	const secondaryEcommerceEvents = useSelect(
		( select: Select ) => {
			if ( ! primaryEcommerceEvent ) {
				return [];
			}

			const events = select(
				MODULES_ANALYTICS_4
			).getSecondaryEcommerceEvents( primaryEcommerceEvent );

			return Array.isArray( events ) ? events : [];
		},
		[ primaryEcommerceEvent ]
	);

	function onToggleDriver(
		goalType: GoalType,
		driverID: GoalDriverID,
		isChecked: boolean
	) {
		const currentDriverIDs = getSelectedDriverIDs(
			selectedDriverState,
			goalType
		);

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
				[ GOAL_TYPES.ECOMMERCE ]: getSelectedDriverIDs(
					selectedDriverState,
					GOAL_TYPES.ECOMMERCE
				),
				[ GOAL_TYPES.LEAD ]: getSelectedDriverIDs(
					selectedDriverState,
					GOAL_TYPES.LEAD
				),
				[ goalType ]: nextDriverIDs,
			},
		} );
	}

	return (
		<SelectionPanelContent className="googlesitekit-site-goals-selection-panel__content">
			{ hasEcommerceGoalDrivers && (
				<GoalTypeSection
					listID={ GOAL_TYPES.ECOMMERCE }
					title={ __(
						'Online store performance',
						'google-site-kit'
					) }
					isExpanded={ isEcommerceExpanded }
					onToggleExpand={ () =>
						setIsEcommerceExpanded(
							( previousState ) => ! previousState
						)
					}
				>
					<VisitorEngagementEventList
						eventIDs={ secondaryEcommerceEvents }
						goalType={ GOAL_TYPES.ECOMMERCE }
						listID={ GOAL_TYPES.ECOMMERCE }
					/>
					<PrimaryActionRow goalType={ GOAL_TYPES.ECOMMERCE } />
					<GoalTypeList
						listID={ GOAL_TYPES.ECOMMERCE }
						options={ ecommerceOptions }
						selectedIDs={ getSelectedDriverIDs(
							selectedDriverState,
							GOAL_TYPES.ECOMMERCE
						) }
						onToggleDriver={ ( driverID, isChecked ) =>
							onToggleDriver(
								GOAL_TYPES.ECOMMERCE,
								driverID,
								isChecked
							)
						}
					/>
				</GoalTypeSection>
			) }

			{ hasLeadGoalDrivers && (
				<GoalTypeSection
					listID={ GOAL_TYPES.LEAD }
					title={ __(
						'Lead generation performance',
						'google-site-kit'
					) }
					isExpanded={ isLeadExpanded }
					onToggleExpand={ () =>
						setIsLeadExpanded(
							( previousState ) => ! previousState
						)
					}
				>
					<PrimaryActionRow goalType={ GOAL_TYPES.LEAD } />
					<GoalTypeList
						listID={ GOAL_TYPES.LEAD }
						options={ leadOptions }
						selectedIDs={ getSelectedDriverIDs(
							selectedDriverState,
							GOAL_TYPES.LEAD
						) }
						onToggleDriver={ ( driverID, isChecked ) =>
							onToggleDriver(
								GOAL_TYPES.LEAD,
								driverID,
								isChecked
							)
						}
					/>
				</GoalTypeSection>
			) }
		</SelectionPanelContent>
	);
};

export default PanelContent;
