/**
 * `core/site` data store: constants.
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
 * Internal dependencies
 */
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_TAGMANAGER } from '@/js/modules/tagmanager/constants';

export const CORE_SITE = 'core/site';

export const AMP_MODE_PRIMARY = 'primary';
export const AMP_MODE_SECONDARY = 'secondary';

export const GOOGLE_TAG_GATEWAY_MODULES = [
	MODULE_SLUG_ANALYTICS_4,
	MODULE_SLUG_ADS,
	MODULE_SLUG_TAGMANAGER,
];
