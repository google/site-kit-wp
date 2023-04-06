/**
 * Analytics module constants
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

export const AREA_MODULE_ANALYTICS_MAIN = 'moduleAnalyticsMain';

/**
 * Date that Universal Analytics will stop recording data: July 1, 2023.
 *
 * This is used across the plugin to trigger notifications and UI related
 * to the UA deprecation/cutoff date.
 *
 * It's also used to display a line on charts indicating why UA-sourced
 * data has no data after this date. This can be changed temporarily to test
 * the date marker UI.
 */
export const UA_CUTOFF_DATE = '2023-07-01';
