/**
 * GA4 module constants.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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

export const ACTIVATION_STEP_REMINDER = 0;
export const ACTIVATION_STEP_SETUP = 1;
export const ACTIVATION_STEP_SUCCESS = 2;

export const ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY =
	'activation-acknowledgement-tooltip-state';

export const GA4_ACTIVATION_BANNER_STATE_KEY = 'ga4-activation-banner-state';

export const ENHANCED_MEASUREMENT_ACTIVATION_BANNER_TOOLTIP_STATE_KEY =
	'enhanced-measurement-activation-banner-tooltip-state';
export const ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY =
	'enhanced-measurement-activation-banner-dismissed-item';

export const REPORT_ARGS_SELECTED_METRIC_KEY = '_r.explorerCard..selmet';
export const REPORT_ARGS_SELECTED_DIMENSION_KEY = '_r.explorerCard..seldim';
export const REPORT_ARGS_DATA_FILTERS_KEY = '_r..dataFilters';
export const REPORT_ARGS_NAV_KEY = '_r..nav';

export const KM_CONNECT_GA4_CTA_WIDGET_DISMISSED_ITEM_KEY =
	'key-metrics-connect-ga4-cta-widget';

/**
 * Date that Site Kit will automatically switch to using GA4: September 25, 2023.
 *
 * With Site Kit's maximum date range being three months, once this period has passed since the UA cutoff date,
 * it will no longer be able to show any historical data for UA and will automatically switch to GA4.
 * For operational reasons, we automatically make the switch a few days before the three month cutoff point.
 *
 * @since 1.107.0
 * @see UA_CUTOFF_DATE.
 */
export const GA4_AUTO_SWITCH_DATE = '2023-09-25';
