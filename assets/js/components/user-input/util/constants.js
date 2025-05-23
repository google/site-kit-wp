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

/**
 * Internal dependencies
 */
import { ENUM_CONVERSION_EVENTS } from '../../../modules/analytics-4/datastore/constants';

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

export const FORM_USER_INPUT_QUESTION_NUMBER = 'user_input_question_number';
export const FORM_USER_INPUT_QUESTION_SNAPSHOT = 'user_input_question_snapshot';
export const USER_INPUT_LEGACY_SITE_PURPOSE_DISMISSED_ITEM_KEY =
	'user-input-legacy-site-purpose-dismissed-item';

export const USER_INPUT_PURPOSE_TO_CONVERSION_EVENTS_MAPPING = {
	publish_blog: [
		ENUM_CONVERSION_EVENTS.CONTACT,
		ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
	],
	publish_news: [
		ENUM_CONVERSION_EVENTS.CONTACT,
		ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
	],
	monetize_content: [],
	sell_products_or_service: [
		ENUM_CONVERSION_EVENTS.PURCHASE,
		ENUM_CONVERSION_EVENTS.ADD_TO_CART,
	],
	sell_products: [
		ENUM_CONVERSION_EVENTS.PURCHASE,
		ENUM_CONVERSION_EVENTS.ADD_TO_CART,
	],
	provide_services: [
		ENUM_CONVERSION_EVENTS.CONTACT,
		ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
	],
	share_portfolio: [
		ENUM_CONVERSION_EVENTS.CONTACT,
		ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
	],
	other: [],
};

/**
 * Gets available questions for user input settings.
 *
 * @since 1.139.0
 * @private
 *
 * @return {Object} Questions object.
 */
export function getUserInputQuestions() {
	const description = __(
		'Based on your answer, Site Kit will suggest the metrics you see on your dashboard to help you track how close you’re getting to your specific goals',
		'google-site-kit'
	);

	return [
		{
			title: __(
				'What is the main purpose of this site?',
				'google-site-kit'
			),
			description,
		},
		{
			title: __(
				'How often do you create new content for this site?',
				'google-site-kit'
			),
			description,
		},
		{
			title: __(
				'What are your top 3 goals for this site?',
				'google-site-kit'
			),
			description,
		},
	];
}

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
			sell_products: __( 'Sell products', 'google-site-kit' ),
			provide_services: __( 'Provide services', 'google-site-kit' ),
			monetize_content: __( 'Monetize content', 'google-site-kit' ),
			publish_blog: __( 'Publish a blog', 'google-site-kit' ),
			publish_news: __( 'Publish news content', 'google-site-kit' ),
			share_portfolio: __(
				'Portfolio or business card',
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
			generating_leads: __( 'Generate leads', 'google-site-kit' ),
			help_better_rank: __(
				'Help my content rank in a better position in Google search results',
				'google-site-kit'
			),
			understanding_content_performance: __(
				'Understand which content is performing best',
				'google-site-kit'
			),
			encourage_to_post: __(
				'Encouragement to post more frequently',
				'google-site-kit'
			),
			other: __( 'Other', 'google-site-kit' ),
		},
	};
}

/**
 * Gets available answer descriptions for user input settings.
 *
 * @since 1.139.0
 * @private
 *
 * @return {Object} Answer descriptions object.
 */
export function getUserInputAnswersDescription() {
	return {
		USER_INPUT_ANSWERS_PURPOSE: {
			sell_products_or_service: __(
				'E.g. selling products like devices, apparel, equipment, etc. or offering services like courses, consulting, tutoring, etc.',
				'google-site-kit'
			),
			sell_products: __(
				'E.g. selling devices, apparel, equipment, etc.',
				'google-site-kit'
			),
			provide_services: __(
				'E.g. offering courses, consulting, tutoring, etc.',
				'google-site-kit'
			),
			monetize_content: __(
				'Using display ads, affiliate links, sponsored content, etc.',
				'google-site-kit'
			),
			publish_blog: __(
				'Writing on a topic you’re passionate about, no focus on monetizing content',
				'google-site-kit'
			),
			publish_news: __(
				'E.g. local news, investigative pieces, interviews, etc.',
				'google-site-kit'
			),
			share_portfolio: __(
				'My website represents me or my company',
				'google-site-kit'
			),
			other: undefined,
		},
	};
}
