/**
 * Site Goals Selection Panel PrimaryActionRow component.
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
import ThumbsSurveyTrigger from '@/js/components/surveys/ThumbsSurveyTrigger';
import Typography from '@/js/components/Typography';
import {
	SITE_GOALS_PANEL_VOTE_IDS_BY_GOAL_TYPE,
	SITE_GOALS_THUMBS_DOWNVOTE_FORM_URL,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

interface PrimaryActionRowProps {
	goalType: GoalType;
}

/**
 * Renders the Key action label and thumbs feedback trigger for a goal type
 * in the Site Goals selection panel.
 *
 * @since n.e.x.t
 *
 * @param props          Component props.
 * @param props.goalType Goal type (`ecommerce` or `lead`).
 * @return React element, or null when no primary action applies.
 */
const PrimaryActionRow: FC< PrimaryActionRowProps > = ( { goalType } ) => {
	const primaryActionLabel = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getPrimaryActionPanelLabel(
				goalType
			),
		[ goalType ]
	) as string | undefined;

	if ( ! primaryActionLabel ) {
		return null;
	}

	const voteID = SITE_GOALS_PANEL_VOTE_IDS_BY_GOAL_TYPE[ goalType ];

	return (
		<div className="googlesitekit-site-goals-selection-panel__primary-action-row">
			<div className="googlesitekit-site-goals-selection-panel__primary-action-row-label">
				<Typography
					type="body"
					size="small"
					className="googlesitekit-site-goals-selection-panel__primary-action-row-key"
				>
					{ __( 'Key action', 'google-site-kit' ) }
				</Typography>
				<Typography
					type="title"
					size="small"
					className="googlesitekit-site-goals-selection-panel__primary-action-row-value"
				>
					{ primaryActionLabel }
				</Typography>
			</div>
			<div className="googlesitekit-site-goals-selection-panel__primary-action-row-feedback">
				<Typography
					type="body"
					size="small"
					className="googlesitekit-site-goals-selection-panel__primary-action-row-prompt"
				>
					{ __( 'Is this a key action?', 'google-site-kit' ) }
				</Typography>
				<ThumbsSurveyTrigger
					voteID={ voteID }
					downvoteFormURL={ SITE_GOALS_THUMBS_DOWNVOTE_FORM_URL }
					ariaLabel={ __(
						'Is this a key action?',
						'google-site-kit'
					) }
					popperPlacement="bottom-end"
				/>
			</div>
		</div>
	);
};

export default PrimaryActionRow;
