/**
 * Site Goals selection panel constants.
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
import { ENUM_CONVERSION_EVENTS } from '@/js/modules/analytics-4/datastore/constants';
import { GOAL_DRIVER_IDS, GOAL_TYPES } from './goal-drivers/constants';

export const SITE_GOALS_SELECTION_PANEL_OPENED_KEY =
	'googlesitekit-site-goals-selection-panel-opened';

export const SITE_GOALS_SELECTION_FORM = 'site-goals-selection-form';
export const SITE_GOALS_SELECTED_DRIVERS = 'site-goals-selected-drivers';
export const SITE_GOALS_SELECTED_VISITOR_ENGAGEMENT =
	'site-goals-selected-visitor-engagement';

export const SITE_GOALS_MIN_SELECTED_DRIVERS = 1;
export const SITE_GOALS_MAX_SELECTED_DRIVERS = 6;

export const SITE_GOALS_BREAKDOWN_NOTICE = 'site_goals_breakdown_notice';

export const SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS = [
	'googlesitekit_event_provider',
	'googlesitekit_form_id',
];

export const SITE_GOALS_DEFAULT_SELECTED_DRIVERS = {
	[ GOAL_TYPES.ECOMMERCE ]: [
		GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
		GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE,
		GOAL_DRIVER_IDS.VISITOR_TYPE,
	],
	[ GOAL_TYPES.LEAD ]: [
		GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
		GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE,
		GOAL_DRIVER_IDS.VISITOR_TYPE,
	],
};

export const SITE_GOALS_DEFAULT_SELECTED_VISITOR_ENGAGEMENT = {
	[ GOAL_TYPES.ECOMMERCE ]: [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ],
	[ GOAL_TYPES.LEAD ]: [],
};
