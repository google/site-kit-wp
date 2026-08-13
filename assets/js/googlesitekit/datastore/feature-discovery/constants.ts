/**
 * `core/feature-discovery` data store constants.
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

export const CORE_FEATURE_DISCOVERY = 'core/feature-discovery';

export const FEATURE_CATEGORIES = {
	AUDIENCE: 'audience',
	ENGAGEMENT: 'engagement',
	MONETIZATION: 'monetization',
	TRAFFIC: 'traffic',
	PRIVACY: 'privacy',
	PERFORMANCE: 'performance',
	PRODUCTIVITY: 'productivity',
} as const;

// The curated order the categories are displayed in.
export const FEATURE_CATEGORY_ORDER = [
	FEATURE_CATEGORIES.AUDIENCE,
	FEATURE_CATEGORIES.ENGAGEMENT,
	FEATURE_CATEGORIES.MONETIZATION,
	FEATURE_CATEGORIES.TRAFFIC,
	FEATURE_CATEGORIES.PRIVACY,
	FEATURE_CATEGORIES.PERFORMANCE,
	FEATURE_CATEGORIES.PRODUCTIVITY,
] as const;

export const FEATURE_EFFORTS = {
	JUST_A_FEW_CLICKS: 1,
	SHORT_SETUP: 2,
	IN_DEPTH_SETUP: 3,
} as const;

export const FEATURE_SETUP_TYPES = {
	SETUP_FLOW: 'setup-flow',
	BACKGROUND_TOGGLE: 'background-toggle',
	IN_PLACE_PANEL: 'in-place-panel',
} as const;
