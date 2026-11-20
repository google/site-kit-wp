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
import {
	VOTE_DIRECTION_DOWN,
	VOTE_DIRECTION_UP,
	VoteDirection,
} from '@/js/components/feedback/constants';
import { FeedbackMenuOption } from '@/js/components/feedback/FeedbackMenu';
import ThumbsFeedback from '@/js/components/feedback/ThumbsFeedback';
import Typography from '@/js/components/Typography';
import useViewContext from '@/js/hooks/useViewContext';
import {
	SITE_GOALS_FEEDBACK_NAMESPACE,
	SITE_GOALS_PANEL_DOWNVOTE_REASONS,
	SITE_GOALS_PANEL_FEEDBACK_GROUPS_BY_GOAL_TYPE,
	SITE_GOALS_PANEL_UPVOTE_REASONS,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { trackEvent } from '@/js/util';

// The "Help us improve" reasons offered after voting on "Is this a key action?".
const FEEDBACK_OPTIONS: Record< VoteDirection, FeedbackMenuOption[] > = {
	[ VOTE_DIRECTION_UP ]: [
		{
			id: SITE_GOALS_PANEL_UPVOTE_REASONS.MATTERS_MOST,
			label: __( 'It’s what matters most', 'google-site-kit' ),
			value: SITE_GOALS_PANEL_UPVOTE_REASONS.MATTERS_MOST,
		},
		{
			id: SITE_GOALS_PANEL_UPVOTE_REASONS.ONLY_SOME_MATTER,
			label: __( 'Only some of them matter', 'google-site-kit' ),
			value: SITE_GOALS_PANEL_UPVOTE_REASONS.ONLY_SOME_MATTER,
		},
		{
			id: SITE_GOALS_PANEL_UPVOTE_REASONS.OTHER_ACTIONS_MATTER,
			label: __( 'Other actions matter too', 'google-site-kit' ),
			value: SITE_GOALS_PANEL_UPVOTE_REASONS.OTHER_ACTIONS_MATTER,
		},
	],
	[ VOTE_DIRECTION_DOWN ]: [
		{
			id: SITE_GOALS_PANEL_DOWNVOTE_REASONS.MISSING_OR_WRONG,
			label: __( 'Some are missing or wrong', 'google-site-kit' ),
			value: SITE_GOALS_PANEL_DOWNVOTE_REASONS.MISSING_OR_WRONG,
		},
		{
			id: SITE_GOALS_PANEL_DOWNVOTE_REASONS.CALL_OR_EMAIL_INSTEAD,
			label: __( 'People call or email instead', 'google-site-kit' ),
			value: SITE_GOALS_PANEL_DOWNVOTE_REASONS.CALL_OR_EMAIL_INSTEAD,
		},
		{
			id: SITE_GOALS_PANEL_DOWNVOTE_REASONS.SOMETHING_ELSE_MATTERS_MORE,
			label: __( 'Something else matters more', 'google-site-kit' ),
			value: SITE_GOALS_PANEL_DOWNVOTE_REASONS.SOMETHING_ELSE_MATTERS_MORE,
		},
	],
};

interface PrimaryActionRowProps {
	goalType: GoalType;
}

/**
 * Renders the Key action label and thumbs feedback trigger for a goal type
 * in the Site Goals selection panel.
 *
 * @since 1.182.0
 * @since n.e.x.t Offers a "Help us improve" menu of reasons after each vote.
 *
 * @param props          Component props.
 * @param props.goalType Goal type (`ecommerce` or `lead`).
 * @return React element, or null when no primary action applies.
 */
const PrimaryActionRow: FC< PrimaryActionRowProps > = ( { goalType } ) => {
	const viewContext = useViewContext();

	const primaryActionLabel = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getPrimaryActionPanelLabel(
				goalType
			),
		[ goalType ]
	) as string | undefined;

	const primaryEventSlug = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getPrimaryActionEventSlug( goalType ),
		[ goalType ]
	) as string | undefined;

	if ( ! primaryActionLabel ) {
		return null;
	}

	const feedbackGroup =
		SITE_GOALS_PANEL_FEEDBACK_GROUPS_BY_GOAL_TYPE[ goalType ];

	function handleVote( direction: VoteDirection ) {
		trackEvent(
			`${ viewContext }_site-goals-key-action-survey`,
			direction === 'up' ? 'vote_up' : 'vote_down',
			primaryEventSlug
		);
	}

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
				<ThumbsFeedback
					feedbackNamespace={ SITE_GOALS_FEEDBACK_NAMESPACE }
					feedbackGroup={ feedbackGroup }
					feedbackOptions={ FEEDBACK_OPTIONS }
					onVote={ handleVote }
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
