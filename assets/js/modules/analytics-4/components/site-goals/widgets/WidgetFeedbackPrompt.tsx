/**
 * WidgetFeedbackPrompt component.
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
import ThumbsSurveyTrigger from '@/js/components/surveys/ThumbsSurveyTrigger';
import Typography from '@/js/components/Typography';
import { BREAKPOINT_SMALL, useBreakpoint } from '@/js/hooks/useBreakpoint';
import { SITE_GOALS_THUMBS_DOWNVOTE_FORM_URL } from '@/js/modules/analytics-4/components/site-goals/constants';

interface WidgetFeedbackPromptProps {
	voteID: string;
}

/**
 * Renders the "Is this section helpful?" prompt with thumbs feedback
 * for a Site Goals widget card.
 *
 * @since n.e.x.t
 *
 * @param props        Component props.
 * @param props.voteID Identifier used to build the survey trigger string.
 * @return React element.
 */
const WidgetFeedbackPrompt: FC< WidgetFeedbackPromptProps > = ( {
	voteID,
} ) => {
	const breakpoint = useBreakpoint();
	// On mobile the feedback row isn't right-aligned, so `top-end` pushes the
	// popper past the card edge. Center it above the thumbs instead and let
	// Popper shift it to fit.
	const popperPlacement = breakpoint === BREAKPOINT_SMALL ? 'top' : 'top-end';

	return (
		<div className="googlesitekit-site-goals-widget__feedback">
			<Typography
				type="label"
				size="small"
				className="googlesitekit-site-goals-widget__feedback-prompt"
			>
				{ __( 'Is this section helpful?', 'google-site-kit' ) }
			</Typography>
			<ThumbsSurveyTrigger
				voteID={ voteID }
				downvoteFormURL={ SITE_GOALS_THUMBS_DOWNVOTE_FORM_URL }
				popperPlacement={ popperPlacement }
			/>
		</div>
	);
};

export default WidgetFeedbackPrompt;
