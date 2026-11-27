/**
 * SiteGoalsWidgetFeedback component.
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
import {
	VOTE_DIRECTION_DOWN,
	VOTE_DIRECTION_UP,
	VoteDirection,
} from '@/js/components/feedback/constants';
import { FeedbackMenuOption } from '@/js/components/feedback/FeedbackMenu';
import FeedbackPrompt from '@/js/components/feedback/FeedbackPrompt';
import useViewContext from '@/js/hooks/useViewContext';
import {
	SITE_GOALS_FEEDBACK_NAMESPACE,
	SITE_GOALS_WIDGET_DOWNVOTE_REASONS,
	SITE_GOALS_WIDGET_FEEDBACK_GROUPS_BY_GOAL_TYPE,
	SITE_GOALS_WIDGET_UPVOTE_REASONS,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

// The "Help us improve" reasons offered after voting on "Is this section
// helpful?".
const FEEDBACK_OPTIONS: Record< VoteDirection, FeedbackMenuOption[] > = {
	[ VOTE_DIRECTION_UP ]: [
		{
			id: `site-goals-widget-feedback-${ SITE_GOALS_WIDGET_UPVOTE_REASONS.SHOWS_WHAT_DRIVES_RESULTS }`,
			label: __(
				'Shows me which traffic actually drives results',
				'google-site-kit'
			),
			value: SITE_GOALS_WIDGET_UPVOTE_REASONS.SHOWS_WHAT_DRIVES_RESULTS,
		},
		{
			id: `site-goals-widget-feedback-${ SITE_GOALS_WIDGET_UPVOTE_REASONS.CLEAR_CHANNEL_VISIBILITY }`,
			label: __(
				'Clear visibility into which channels are working for me',
				'google-site-kit'
			),
			value: SITE_GOALS_WIDGET_UPVOTE_REASONS.CLEAR_CHANNEL_VISIBILITY,
		},
		{
			id: `site-goals-widget-feedback-${ SITE_GOALS_WIDGET_UPVOTE_REASONS.EASY_TO_UNDERSTAND }`,
			label: __( 'Easy to understand at a glance', 'google-site-kit' ),
			value: SITE_GOALS_WIDGET_UPVOTE_REASONS.EASY_TO_UNDERSTAND,
		},
	],
	[ VOTE_DIRECTION_DOWN ]: [
		{
			id: `site-goals-widget-feedback-${ SITE_GOALS_WIDGET_DOWNVOTE_REASONS.MISSING_METRICS }`,
			label: __(
				'It’s missing the metrics I track / care about',
				'google-site-kit'
			),
			value: SITE_GOALS_WIDGET_DOWNVOTE_REASONS.MISSING_METRICS,
		},
		{
			id: `site-goals-widget-feedback-${ SITE_GOALS_WIDGET_DOWNVOTE_REASONS.NUMBERS_WRONG }`,
			label: __( 'Numbers are wrong or out of date', 'google-site-kit' ),
			value: SITE_GOALS_WIDGET_DOWNVOTE_REASONS.NUMBERS_WRONG,
		},
		{
			id: `site-goals-widget-feedback-${ SITE_GOALS_WIDGET_DOWNVOTE_REASONS.METRIC_UNCLEAR }`,
			label: __(
				'I don’t understand what a metric means',
				'google-site-kit'
			),
			value: SITE_GOALS_WIDGET_DOWNVOTE_REASONS.METRIC_UNCLEAR,
		},
	],
};

interface SiteGoalsWidgetFeedbackProps {
	goalType: GoalType;
}

/**
 * Renders the "Is this section helpful?" feedback in a Site Goals widget's
 * footer, with a "Help us improve" menu of reasons after each vote.
 *
 * @since n.e.x.t
 *
 * @param props          Component props.
 * @param props.goalType Goal type of the widget (`ecommerce` or `lead`).
 * @return React element.
 */
const SiteGoalsWidgetFeedback: FC< SiteGoalsWidgetFeedbackProps > = ( {
	goalType,
} ) => {
	const viewContext = useViewContext();

	return (
		<FeedbackPrompt
			feedbackNamespace={ SITE_GOALS_FEEDBACK_NAMESPACE }
			feedbackGroup={
				SITE_GOALS_WIDGET_FEEDBACK_GROUPS_BY_GOAL_TYPE[ goalType ]
			}
			feedbackOptions={ FEEDBACK_OPTIONS }
			gaTrackingEventArgs={ {
				category: `${ viewContext }_site-goals-widget-survey`,
				label: goalType,
			} }
		/>
	);
};

export default SiteGoalsWidgetFeedback;
