/**
 * Feature Discovery story fixtures.
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
 * Internal dependencies
 */
import {
	FEATURE_BADGES,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/constants';

// Older than the newness floor for the initial version below, so a feature on
// it is not shown as new.
export const STORY_OLD_VERSION = '1.180.0';
export const STORY_INITIAL_VERSION = '1.186.0';

// A spread across four goal categories, one of them still new, so a story
// covers the grouping, the ordering and the badges together.
export const storyFeatures: Partial< Feature >[] = [
	{
		slug: 'analytics-setup',
		title: 'Understand how visitors interact with your content',
		shortDescription:
			'Track your traffic, see which pages perform best, and learn what keeps your audience coming back. Analytics gives you the clear data you need to optimize your user experience and turn casual visitors into loyal customers.',
		effort: FEATURE_EFFORTS.HIGH,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		moduleSlug: MODULE_SLUG_ANALYTICS_4,
		addedInVersion: STORY_OLD_VERSION,
	},
	{
		slug: 'key-metrics',
		title: 'Get personalized suggestions for user interaction metrics based on your goals',
		shortDescription:
			'Tell us your site’s main goal, and we’ll suggest a list of key metrics to help you understand how users interact with your site and what drives progress toward your goals.',
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		addedInVersion: STORY_OLD_VERSION,
	},
	{
		slug: 'sign-in-with-google',
		title: 'Boost onboarding, security, and trust on your site using Sign in with Google',
		shortDescription:
			'Provide your site visitors with a simple, secure, and personalized experience by adding a Sign in with Google button to your login page.',
		effort: FEATURE_EFFORTS.MEDIUM,
		goalCategories: [ FEATURE_CATEGORIES.ENGAGEMENT ],
		moduleSlug: MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
		addedInVersion: STORY_OLD_VERSION,
	},
	{
		slug: 'newsletter-signup',
		title: 'Collect reader emails directly on your site',
		shortDescription:
			'Add a simple sign-up form to your site so readers can share their email addresses with you. It’s an easy, privacy-safe way to start building a list of your most interested visitors.',
		effort: FEATURE_EFFORTS.MEDIUM,
		goalCategories: [
			FEATURE_CATEGORIES.MONETIZATION,
			FEATURE_CATEGORIES.ENGAGEMENT,
		],
		moduleSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
		badges: [ FEATURE_BADGES.RECOMMENDED ],
		addedInVersion: STORY_INITIAL_VERSION,
	},
	{
		slug: 'dashboard-sharing',
		title: 'Collaborate with other team members by sharing dashboard access',
		shortDescription:
			'Give other users access to Site Kit dashboard and insights without sharing your Google account credentials. Choose which dashboards they can view so teammates and clients can stay informed about your site’s performance.',
		effort: FEATURE_EFFORTS.MEDIUM,
		goalCategories: [ FEATURE_CATEGORIES.PRODUCTIVITY ],
		addedInVersion: STORY_OLD_VERSION,
	},
];

export const storyModules = [
	{ slug: MODULE_SLUG_ANALYTICS_4, name: 'Analytics' },
	{
		slug: MODULE_SLUG_READER_REVENUE_MANAGER,
		name: 'Reader Revenue Manager',
	},
	{ slug: MODULE_SLUG_SIGN_IN_WITH_GOOGLE, name: 'Sign in with Google' },
];
