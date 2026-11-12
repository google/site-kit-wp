/**
 * FeedbackPrompt component.
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
import { VoteDirection } from '@/js/components/feedback/constants';
import ThumbsFeedback from '@/js/components/feedback/ThumbsFeedback';
import Typography from '@/js/components/Typography';
import { BREAKPOINT_SMALL, useBreakpoint } from '@/js/hooks/useBreakpoint';
import { GATrackingEventArgs } from '@/js/types/GATrackingEventArgs';
import { trackEvent } from '@/js/util';

interface FeedbackPromptProps {
	/** The product area the feedback is about. */
	feedbackNamespace: string;
	/** The item within the namespace the feedback is about. */
	feedbackGroup: string;
	/**
	 * The vote event's category and label, such as
	 * `{ category: 'mainDashboard_site-goals-widget-survey', label: 'ecommerce' }`.
	 */
	gaTrackingEventArgs: Required< Pick< GATrackingEventArgs, 'category' > > &
		Pick< GATrackingEventArgs, 'label' >;
	/**
	 * Whether to hide the "Is this section helpful?" text, which the thumbs
	 * keep as their accessible name.
	 */
	hideQuestion?: boolean;
	/** Called with the vote's direction, after the vote is tracked. */
	onVote?: ( direction: VoteDirection ) => void;
}

/**
 * Renders the "Is this section helpful?" prompt with thumbs feedback.
 *
 * @since 1.182.0
 * @since 1.190.0 Replaced the `goalType` prop with `gaTrackingEventArgs`.
 * @since 1.191.0 Added the `hideQuestion` prop to show only the thumbs.
 * @since 1.192.0 Added the `onVote` prop. Replaced the `voteID` prop with `feedbackNamespace` and `feedbackGroup`, and send votes to the feedback endpoint instead of triggering a survey.
 *
 * @param props                     Component props.
 * @param props.feedbackNamespace   The product area the feedback is about.
 * @param props.feedbackGroup       The item within the namespace the feedback is about.
 * @param props.gaTrackingEventArgs Category and label used to track the vote event.
 * @param [props.hideQuestion]      Optional. Whether to hide the "Is this section helpful?" text.
 * @param [props.onVote]            Optional. Called with the vote's direction, after the vote is tracked.
 * @return React element.
 */
const FeedbackPrompt: FC< FeedbackPromptProps > = ( {
	feedbackNamespace,
	feedbackGroup,
	gaTrackingEventArgs,
	hideQuestion,
	onVote,
} ) => {
	const breakpoint = useBreakpoint();
	// On mobile the feedback row isn't right-aligned, so `top-end` pushes the
	// popper past the card edge. Center it above the thumbs instead and let
	// Popper shift it to fit.
	const popperPlacement = breakpoint === BREAKPOINT_SMALL ? 'top' : 'top-end';

	function handleVote( direction: VoteDirection ) {
		trackEvent(
			gaTrackingEventArgs.category,
			direction === 'up' ? 'vote_up' : 'vote_down',
			gaTrackingEventArgs.label
		);

		onVote?.( direction );
	}

	const thumbsFeedback = (
		<ThumbsFeedback
			feedbackNamespace={ feedbackNamespace }
			feedbackGroup={ feedbackGroup }
			onVote={ handleVote }
			popperPlacement={ popperPlacement }
		/>
	);

	if ( hideQuestion ) {
		return thumbsFeedback;
	}

	return (
		<div className="googlesitekit-site-goals-widget__feedback">
			<Typography
				type="label"
				size="small"
				className="googlesitekit-site-goals-widget__feedback-prompt"
			>
				{ __( 'Is this section helpful?', 'google-site-kit' ) }
			</Typography>
			{ thumbsFeedback }
		</div>
	);
};

export default FeedbackPrompt;
