/**
 * Site Goals insight notice.
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PreviewBlock from '@/js/components/PreviewBlock';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { AIIcon, AIText } from '@/js/modules/analytics-4/components/ai-insight';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { useSiteGoalsInsight } from '@/js/modules/analytics-4/components/site-goals/hooks/useSiteGoalsInsight';

interface InsightNoticeProps {
	/** The goal type of the widget: `lead` or `ecommerce`. */
	goalType: GoalType;
	/** The open tab, an empty string for a widget without tabs, or `undefined` while it is not known yet. */
	tabID: string | undefined;
}

const InsightNotice: FC< InsightNoticeProps > = ( { goalType, tabID } ) => {
	const insight = useSiteGoalsInsight( goalType, tabID );

	// The live region stays on the page while it is empty, because screen
	// readers only announce text that appears inside a region that was
	// already there, such as an insight shown again after a switch of tab or
	// date range.
	return (
		<div
			className="googlesitekit-site-goals-insight"
			role="status"
			aria-live="polite"
		>
			{ insight === undefined && (
				<PreviewBlock
					className="googlesitekit-ai-insight-preview"
					width="100%"
					height="72px"
				/>
			) }
			{ !! insight && (
				<div className="googlesitekit-site-goals-insight-notice">
					<AIIcon className="googlesitekit-site-goals-insight-notice__icon" />
					<P
						className="googlesitekit-site-goals-insight-notice__text"
						size={ SIZE_MEDIUM }
					>
						<AIText text={ insight.text } />
						{ !! insight.actionableRecommendation && (
							<Fragment>
								{ ' ' }
								<AIText
									text={ insight.actionableRecommendation }
								/>
							</Fragment>
						) }
					</P>
				</div>
			) }
		</div>
	);
};

export default InsightNotice;
