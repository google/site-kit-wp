/**
 * `modules/ads` data store constants.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

export const MODULES_ADS = 'modules/ads';

export const ADWORDS_SCOPE = 'https://www.googleapis.com/auth/adwords';
export const SUPPORT_CONTENT_SCOPE =
	'https://www.googleapis.com/auth/supportcontent';

// Date range offset days for Ads report requests.
export const DATE_RANGE_OFFSET = 1;

export const ADS_MODULE_SETUP_BANNER_PROMPT_DISMISSED_KEY =
	'ads_module_setup_banner_prompt_dismissed_key';

export const ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY = 'wc-redirect-modal';
// This will be removed as part of #10414.
export const ADS_WOOCOMMERCE_REDIRECT_MODAL_DISMISS_KEY = 'wc-redirect-modal';

export const PLUGINS = {
	WOOCOMMERCE: 'woocommerce',
	GOOGLE_FOR_WOOCOMMERCE: 'google-listings-and-ads',
};

export const AVAILABLE_PLUGINS = [
	PLUGINS.WOOCOMMERCE,
	PLUGINS.GOOGLE_FOR_WOOCOMMERCE,
];
