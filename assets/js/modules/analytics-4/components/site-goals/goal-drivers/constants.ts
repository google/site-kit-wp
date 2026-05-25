/**
 * Site Goals Goal Drivers constants.
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

export const GOAL_DRIVER_ROW_LIMIT_COLLAPSED = 3;
export const GOAL_DRIVER_ROW_LIMIT_EXPANDED = 6;
export const MAX_VISIBLE_GOAL_DRIVERS = 6;

export const GOAL_TYPES = {
	LEAD: 'lead',
	ECOMMERCE: 'ecommerce',
} as const;

export const GOAL_DRIVER_IDS = {
	TOP_TRAFFIC_CHANNELS: 'topTrafficChannels',
	TOP_TRAFFIC_CHANNELS_RATE: 'topTrafficChannelsRate',
	TOP_PAGES: 'topPages',
	VISITOR_TYPE: 'visitorType',
	CITIES: 'cities',
	COUNTRIES: 'countries',
	DEVICE_TYPE: 'deviceType',
} as const;
