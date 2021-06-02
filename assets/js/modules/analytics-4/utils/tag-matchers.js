/**
 * Tag matching patterns.
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

export const tagMatchers = [
	// Detect gtag script calls.
	/<script [^>]*src=['|"]https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-([a-zA-Z0-9]+)['|"][^>]*><\/script>/i,
	// Detect common analytics code usage.
	/<script[^>]*>[^<]+google-analytics\.com\/analytics\.js[^<]+G-([a-zA-Z0-9]+)/i,
	/__gaTracker\(\s*['|"]create['|"],\s+['|"]G-([a-zA-Z0-9]+)['|"], ?['|"]auto['|"]\s*\)/i,
	// Detect ga create calls.
	/ga\(\s*['|"]create['|"],\s*['|"]G-([a-zA-Z0-9]+)['|"],\s*['|"]auto['|"]\s?\)/i,
	/_gaq\.push\(\s*\[\s*['|"]_setAccount['|"],\s*['|"]G-([a-zA-Z0-9]+)['|"]\s*]\s*\)/i,
	// Detect amp-analytics gtag.
	/<amp-analytics [^>]*type="gtag"[^>]*>[^<]*<script type="application\/json">[^<]*"gtag_id":\s*"G-([a-zA-Z0-9]+)"/i,
	// Detect amp-analytics googleanalytics.
	/<amp-analytics [^>]*type="googleanalytics"[^>]*>[^<]*<script type="application\/json">[^<]*"account":\s*"G-([a-zA-Z0-9]+)"/i,
];
