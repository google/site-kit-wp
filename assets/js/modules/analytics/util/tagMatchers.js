/**
 * Tag matching patterns.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

export default [
	// Detect gtag script calls.
	/<script [^>]*src=['|"]https:\/\/www.googletagmanager.com\/gtag\/js\?id=(UA-.*?)['|"][^>]*><\/script>/,
	// Detect common analytics code usage.
	/<script[^>]*>[^<]+google-analytics\.com\/analytics\.js[^<]+(UA-\d+-\d+)/,
	/__gaTracker\( ?['|"]create['|"], ?['|"](UA-.*?)['|"], ?['|"]auto['|"] ?\)/,
	// Detect ga create calls.
	/ga\( ?['|"]create['|"], ?['|"](UA-.*?)['|"], ?['|"]auto['|"] ?\)/,
	/_gaq.push\( ?\[ ?['|"]_setAccount['|"], ?['|"](UA-.*?)['|"] ?] ?\)/,
	// Detect amp-analytics gtag.
	/<amp-analytics [^>]*type="gtag"[^>]*>[^<]*<script type="application\/json">[^<]*"gtag_id":\s*"(UA-[^"]+)"/,
	// Detect amp-analytics googleanalytics.
	/<amp-analytics [^>]*type="googleanalytics"[^>]*>[^<]*<script type="application\/json">[^<]*"account":\s*"(UA-[^"]+)"/,
];
