/**
 * User Input Answers.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const USER_INPUT_QUESTIONS_PURPOSE = 'purpose';
export const USER_INPUT_QUESTION_POST_FREQUENCY = 'postFrequency';
export const USER_INPUT_QUESTIONS_GOALS = 'goals';

export const USER_INPUT_QUESTIONS_LIST = [
	USER_INPUT_QUESTIONS_PURPOSE,
	USER_INPUT_QUESTION_POST_FREQUENCY,
	USER_INPUT_QUESTIONS_GOALS,
];

export const USER_INPUT_MAX_ANSWERS = {
	[ USER_INPUT_QUESTIONS_PURPOSE ]: 1,
	[ USER_INPUT_QUESTION_POST_FREQUENCY ]: 1,
	[ USER_INPUT_QUESTIONS_GOALS ]: 3,
};

export const USER_INPUT_CURRENTLY_EDITING_KEY =
	'googlesitekit-user-input-currently-editing';

/**
 * Gets available answers for user input settings.
 *
 * @since 1.20.0
 * @private
 *
 * @return {Object} Answers object.
 */
export function getUserInputAnswers() {
	return {
		USER_INPUT_ANSWERS_PURPOSE: {
			sell_products_or_service: __(
				'Sell products or services',
				'google-site-kit'
			),
			monetize_content: __(
				'Monetize content (with ads or affiliate links)',
				'google-site-kit'
			),
			publish_blog: __( 'Publish a blog', 'google-site-kit' ),
			publish_news: __( 'Publish news content', 'google-site-kit' ),
			share_portfolio: __(
				'Share a business card or portfolio to represent me or my company online',
				'google-site-kit'
			),
			other: __( 'Other', 'google-site-kit' ),
		},
		USER_INPUT_ANSWERS_POST_FREQUENCY: {
			never: __( 'Never', 'google-site-kit' ),
			daily: __( 'Daily', 'google-site-kit' ),
			weekly: __( 'Weekly', 'google-site-kit' ),
			monthly: __( 'Monthly', 'google-site-kit' ),
			other: __( 'Other', 'google-site-kit' ),
		},
		USER_INPUT_ANSWERS_GOALS: {
			retaining_visitors: __(
				'Retain visitors, turn them into loyal readers or customers',
				'google-site-kit'
			),
			improving_performance: __(
				'Improve speed and performance',
				'google-site-kit'
			),
			finding_new_topics: __(
				'Find new topics to write about that connect with my audience',
				'google-site-kit'
			),
			growing_audience: __( 'Grow my audience', 'google-site-kit' ),
			expanding_business: __(
				'Expand my business into new cities, states or markets',
				'google-site-kit'
			),
			generating_revenue: __(
				'Generate more revenue',
				'google-site-kit'
			),
			help_better_rank: __(
				'Help my content rank in a better position in Google search results',
				'google-site-kit'
			),
			understanding_content_performance: __(
				'Understand which content is performing best',
				'google-site-kit'
			),
			encourage_to_post: __(
				'Tips for generating and posting engaging content updates',
				'google-site-kit'
			),
			other: __( 'Other', 'google-site-kit' ),
		},
	};
}
