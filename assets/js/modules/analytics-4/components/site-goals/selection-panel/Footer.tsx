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
import type { FC } from 'react';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { SelectionPanelFooter } from '@/js/components/SelectionPanel';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import useFormValue from '@/js/hooks/useFormValue';
import {
	SITE_GOALS_EFFECTIVE_DRIVERS,
	SITE_GOALS_MAX_SELECTED_DRIVERS,
	SITE_GOALS_SELECTED_DRIVERS,
	SITE_GOALS_SELECTION_FORM,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import {
	GOAL_TYPES,
	resolveGoalDriverSelectionState,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import type { GoalDriverSelectionState } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

interface FooterProps {
	isOpen: boolean;
	closePanel: () => void;
}

function flattenSelections( selections?: GoalDriverSelectionState ): string[] {
	if ( ! selections ) {
		return [];
	}

	return [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ].flatMap( ( goalType ) =>
		( selections[ goalType ] || [] ).map(
			( goalDriverID ) => `${ goalType }:${ goalDriverID }`
		)
	);
}

const Footer: FC< FooterProps > = ( { isOpen, closePanel } ) => {
	const { setValues } = useDispatch( CORE_FORMS );

	const [ selectedDrivers ] = useFormValue(
		SITE_GOALS_SELECTION_FORM,
		SITE_GOALS_SELECTED_DRIVERS
	);
	const resolvedSelectedDrivers = resolveGoalDriverSelectionState(
		selectedDrivers as GoalDriverSelectionState | undefined
	);
	const selectedDriverSlugs = flattenSelections( resolvedSelectedDrivers );
	function saveSettings() {
		const sanitizedSelectionState = resolveGoalDriverSelectionState(
			resolvedSelectedDrivers
		);

		setValues( SITE_GOALS_SELECTION_FORM, {
			[ SITE_GOALS_SELECTED_DRIVERS ]: sanitizedSelectionState,
			[ SITE_GOALS_EFFECTIVE_DRIVERS ]: sanitizedSelectionState,
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
			minSelectedItemCount={ 0 }
			maxSelectedItemCount={ SITE_GOALS_MAX_SELECTED_DRIVERS * 2 }
		/>
	);
};

export default Footer;
