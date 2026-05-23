/**
 * Site Goals Selection Panel Visitor Engagement Event List component.
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
import useFormValue from '@/js/hooks/useFormValue';
import {
	SITE_GOALS_SELECTED_VISITOR_ENGAGEMENT,
	SITE_GOALS_SELECTION_FORM,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import {
	getVisitorEngagementEventOptions,
	resolveVisitorEngagementSelectionState,
} from '@/js/modules/analytics-4/components/site-goals/visitor-engagement';
import { VisitorEngagementEventID } from '@/js/modules/analytics-4/components/site-goals/visitor-engagement/registry';

interface VisitorEngagementEventListProps {
	goalType: GoalType;
	listID: string;
	eventIDs?: string[];
}

const VisitorEngagementEventList: FC< VisitorEngagementEventListProps > = ( {
	eventIDs = [],
	goalType,
	listID,
} ) => {
	const [ selectedVisitorEngagement, setSelectedVisitorEngagement ] =
		useFormValue(
			SITE_GOALS_SELECTION_FORM,
			SITE_GOALS_SELECTED_VISITOR_ENGAGEMENT
		);

	const eventIDSet = new Set( eventIDs );
	const options = getVisitorEngagementEventOptions( goalType ).filter(
		( option ) => eventIDSet.has( option.id )
	);

	if ( ! options.length ) {
		return null;
	}

	const selectedVisitorEngagementState =
		resolveVisitorEngagementSelectionState( selectedVisitorEngagement );
	const selectedEventIDs = selectedVisitorEngagementState[ goalType ];
	const selectedSet = new Set( selectedEventIDs );

	function onToggleEvent(
		eventID: VisitorEngagementEventID,
		isChecked: boolean
	) {
		let nextEventIDs = selectedEventIDs;

		if ( isChecked ) {
			if ( ! selectedEventIDs.includes( eventID ) ) {
				nextEventIDs = selectedEventIDs.concat( eventID );
			}
		} else {
			nextEventIDs = selectedEventIDs.filter(
				( selectedEventID ) => selectedEventID !== eventID
			);
		}

		setSelectedVisitorEngagement( {
			[ GOAL_TYPES.ECOMMERCE ]:
				selectedVisitorEngagementState[ GOAL_TYPES.ECOMMERCE ],
			[ GOAL_TYPES.LEAD ]:
				selectedVisitorEngagementState[ GOAL_TYPES.LEAD ],
			[ goalType ]: nextEventIDs,
		} );
	}

	return (
		<div className="googlesitekit-site-goals-selection-panel__subsection">
			<Typography
				as="p"
				type="body"
				size="small"
				className="googlesitekit-site-goals-selection-panel__items-title"
			>
				{ __( 'Visitor engagement', 'google-site-kit' ) }
			</Typography>

			{ options.map( ( option ) => (
				<SelectionPanelItem
					key={ option.id }
					id={ `site-goals-selection-visitor-engagement-${ option.id }-${ listID }` }
					slug={ option.id }
					title={ option.title }
					isItemSelected={ selectedSet.has( option.id ) }
					onCheckboxChange={ (
						event: ChangeEvent< HTMLInputElement >
					) => onToggleEvent( option.id, event.target.checked ) }
				/>
			) ) }
		</div>
	);
};

export default VisitorEngagementEventList;
