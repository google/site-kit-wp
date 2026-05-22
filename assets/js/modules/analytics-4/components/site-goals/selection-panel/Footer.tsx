/**
 * Site Goals Selection Panel Footer component.
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
import { useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import {
	GOAL_TYPES,
	resolveGoalDriverSelectionState,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import { resolveVisitorEngagementSelectionState } from '@/js/modules/analytics-4/components/site-goals/visitor-engagement';
import {
	SITE_GOALS_EFFECTIVE_DRIVERS,
	SITE_GOALS_EFFECTIVE_VISITOR_ENGAGEMENT,
	SITE_GOALS_MAX_SELECTED_DRIVERS,
	SITE_GOALS_MIN_SELECTED_DRIVERS,
	SITE_GOALS_SELECTED_DRIVERS,
	SITE_GOALS_SELECTED_VISITOR_ENGAGEMENT,
	SITE_GOALS_SELECTION_FORM,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { SelectionPanelFooter } from '@/js/components/SelectionPanel';
import useFormValue from '@/js/hooks/useFormValue';
import {
	GoalDriverID,
	GoalDriverSelectionState,
	GoalType,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

interface FooterProps {
	isOpen: boolean;
	closePanel: () => void;
	hasEcommerceGoalDrivers: boolean;
	hasLeadGoalDrivers: boolean;
}

function getSelectedDriverIDsForGoalType(
	selectedDrivers: GoalDriverSelectionState | undefined,
	goalType: GoalType
): GoalDriverID[] {
	const selectedDriverIDs = selectedDrivers?.[ goalType ];

	if ( ! Array.isArray( selectedDriverIDs ) ) {
		return [];
	}

	return selectedDriverIDs.filter(
		( selectedDriverID ): selectedDriverID is GoalDriverID =>
			typeof selectedDriverID === 'string'
	);
}

function flattenSelections( selections: GoalDriverSelectionState ): string[] {
	return [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ].flatMap( ( goalType ) =>
		getSelectedDriverIDsForGoalType( selections, goalType ).map(
			( goalDriverID ) => `${ goalType }:${ goalDriverID }`
		)
	);
}

function hasInvalidSelection(
	selectedDrivers: GoalDriverSelectionState,
	hasEcommerceGoalDrivers: boolean,
	hasLeadGoalDrivers: boolean
): boolean {
	const goalTypesToValidate: GoalType[] = [];

	if ( hasEcommerceGoalDrivers ) {
		goalTypesToValidate.push( GOAL_TYPES.ECOMMERCE );
	}

	if ( hasLeadGoalDrivers ) {
		goalTypesToValidate.push( GOAL_TYPES.LEAD );
	}

	return goalTypesToValidate.some( ( goalType ) => {
		const selectedCount = getSelectedDriverIDsForGoalType(
			selectedDrivers,
			goalType
		).length;

		return (
			selectedCount < SITE_GOALS_MIN_SELECTED_DRIVERS ||
			selectedCount > SITE_GOALS_MAX_SELECTED_DRIVERS
		);
	} );
}

const Footer: FC< FooterProps > = ( {
	isOpen,
	closePanel,
	hasEcommerceGoalDrivers,
	hasLeadGoalDrivers,
} ) => {
	const { setValues } = useDispatch( CORE_FORMS );

	const [ selectedDrivers ] = useFormValue(
		SITE_GOALS_SELECTION_FORM,
		SITE_GOALS_SELECTED_DRIVERS
	);
	const selectedDriverState = selectedDrivers as
		| GoalDriverSelectionState
		| undefined;
	const [ selectedVisitorEngagement ] = useFormValue(
		SITE_GOALS_SELECTION_FORM,
		SITE_GOALS_SELECTED_VISITOR_ENGAGEMENT
	);
	const selectedDriverSlugs = flattenSelections(
		selectedDriverState || {
			[ GOAL_TYPES.ECOMMERCE ]: [],
			[ GOAL_TYPES.LEAD ]: [],
		}
	);
	const hasSelectionError = hasInvalidSelection(
		selectedDriverState || {
			[ GOAL_TYPES.ECOMMERCE ]: [],
			[ GOAL_TYPES.LEAD ]: [],
		},
		hasEcommerceGoalDrivers,
		hasLeadGoalDrivers
	);

	function saveSettings() {
		const sanitizedSelectionState =
			resolveGoalDriverSelectionState( selectedDriverState );
		const sanitizedVisitorEngagementSelectionState =
			resolveVisitorEngagementSelectionState( selectedVisitorEngagement );

		setValues( SITE_GOALS_SELECTION_FORM, {
			[ SITE_GOALS_SELECTED_DRIVERS ]: sanitizedSelectionState,
			[ SITE_GOALS_EFFECTIVE_DRIVERS ]: sanitizedSelectionState,
			[ SITE_GOALS_SELECTED_VISITOR_ENGAGEMENT ]:
				sanitizedVisitorEngagementSelectionState,
			[ SITE_GOALS_EFFECTIVE_VISITOR_ENGAGEMENT ]:
				sanitizedVisitorEngagementSelectionState,
		} );

		return Promise.resolve( {} );
	}

	return (
		<SelectionPanelFooter
			isOpen={ isOpen }
			closePanel={ closePanel }
			saveSettings={ saveSettings }
			savedItemSlugs={ [] }
			// @ts-expect-error - `SelectionPanelFooter` prop typing is currently incomplete.
			selectedItemSlugs={ selectedDriverSlugs }
			minSelectedItemCount={
				hasSelectionError ? SITE_GOALS_MIN_SELECTED_DRIVERS : 0
			}
			maxSelectedItemCount={
				hasSelectionError ? 0 : SITE_GOALS_MAX_SELECTED_DRIVERS * 2
			}
		/>
	);
};

export default Footer;
