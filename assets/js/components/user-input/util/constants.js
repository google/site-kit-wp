/**
 * User Input Answers.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

export const USER_INPUT_QUESTION_ROLE = 'role';
export const USER_INPUT_QUESTION_POST_FREQUENCY = 'postFrequency';
export const USER_INPUT_QUESTION_GOALS = 'goals';
export const USER_INPUT_QUESTION_HELP_NEEDED = 'helpNeeded';
export const USER_INPUT_QUESTION_SEARCH_TERMS = 'searchTerms';

/**
 * Gets available answers for user input settings.
 *
 * @since n.e.x.t
 * @private
 *
 * @return {Object} Answers object.
 */
export function getUserInputAnwsers() {
	return {
		USER_INPUT_ANSWERS_ROLE: {
			owner: __( 'I am the owner and sole creator and admin', 'google-site-kit' ),
			owner_with_team: __( 'I am the owner of the site and have a team who works on this site', 'google-site-kit' ),
			in_house_team: __( 'I am part of the in-house team in a content creation, growth, SEO or technical role', 'google-site-kit' ),
			part_type_freelancer: __( 'I am a part-time or freelance consultant who is helping with this site', 'google-site-kit' ),
		},
		USER_INPUT_ANSWERS_POST_FREQUENCY: {
			never: __( 'Never', 'google-site-kit' ),
			daily: __( 'Every day', 'google-site-kit' ),
			weekly: __( 'Once a week or less', 'google-site-kit' ),
			monthly: __( 'Once a month or less', 'google-site-kit' ),
		},
		USER_INPUT_ANSWERS_GOALS: {
			sell_products_or_service: __( 'Sell products or services', 'google-site-kit' ),
			monetize_content: __( 'Monetize content (with ads or affiliate links)', 'google-site-kit' ),
			publish_blog: __( 'Publish a blog', 'google-site-kit' ),
			publish_news: __( 'Publish news content', 'google-site-kit' ),
			share_portfolio: __( 'Share a business card or portfolio to represent me or my company online', 'google-site-kit' ),
		},
		USER_INPUT_ANSWERS_HELP_NEEDED: {
			retaining_visitors: __( 'Retaining visitors, turning them into loyal readers or customers', 'google-site-kit' ),
			improving_performance: __( 'Improving speed and performance', 'google-site-kit' ),
			finding_new_topics: __( 'Finding new topics to write about that connect with my audience', 'google-site-kit' ),
			growing_audience: __( 'Growing my audience', 'google-site-kit' ),
			expanding_business: __( 'Expanding my business into new cities, states or markets', 'google-site-kit' ),
			generating_revenue: __( 'Generating more revenue', 'google-site-kit' ),
			help_better_rank: __( 'Help my content rank in a better position in Google search results', 'google-site-kit' ),
			understanding_content_performance: __( 'Understanding which content is performing best', 'google-site-kit' ),
			encourage_to_post: __( 'Encouragement to post more frequently', 'google-site-kit' ),
		},
	};
}
