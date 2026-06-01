/**
 * Site Goals Selection Panel Save Error Notice component.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SelectionPanelError from '@/js/components/SelectionPanel/SelectionPanelError';
import useFormValue from '@/js/hooks/useFormValue';
import {
	SITE_GOALS_MAX_SELECTED_DRIVERS,
	SITE_GOALS_MIN_SELECTED_DRIVERS,
	SITE_GOALS_SELECTED_DRIVERS,
	SITE_GOALS_SELECTION_FORM,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import {
	GoalDriverSelectionState,
	GoalType,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

export interface SaveErrorNoticeProps {
	hasEcommerceGoalDrivers: boolean;
	hasLeadGoalDrivers: boolean;
}

function getSelectedCountForGoalType(
	selectedDrivers: GoalDriverSelectionState | undefined,
	goalType: GoalType
): number {
	const selectedDriverIDs = selectedDrivers?.[ goalType ];

	if ( ! Array.isArray( selectedDriverIDs ) ) {
		return 0;
	}

	return selectedDriverIDs.filter(
		( selectedDriverID ) => typeof selectedDriverID === 'string'
	).length;
}

const SaveErrorNotice: FC< SaveErrorNoticeProps > = ( {
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

	const activeGoalTypes: GoalType[] = [];

	if ( hasEcommerceGoalDrivers ) {
		activeGoalTypes.push( GOAL_TYPES.ECOMMERCE );
	}

	if ( hasLeadGoalDrivers ) {
		activeGoalTypes.push( GOAL_TYPES.LEAD );
	}

	for ( const goalType of activeGoalTypes ) {
		const selectedCount = getSelectedCountForGoalType(
			selectedDriverState,
			goalType
		);

		if ( selectedCount < SITE_GOALS_MIN_SELECTED_DRIVERS ) {
			return (
				<SelectionPanelError
					error={ {
						message: sprintf(
							/* translators: %d: minimum number of selected metrics. */
							__(
								'Select at least %d metric',
								'google-site-kit'
							),
							SITE_GOALS_MIN_SELECTED_DRIVERS
						),
					} }
					skipRetryMessage
				/>
			);
		}

		if ( selectedCount > SITE_GOALS_MAX_SELECTED_DRIVERS ) {
			return (
				<SelectionPanelError
					error={ {
						message: sprintf(
							/* translators: %d: maximum number of selected metrics. */
							__( 'Select up to %d metrics', 'google-site-kit' ),
							SITE_GOALS_MAX_SELECTED_DRIVERS
						),
					} }
					skipRetryMessage
				/>
			);
		}
	}

	return null;
};

export default SaveErrorNotice;
