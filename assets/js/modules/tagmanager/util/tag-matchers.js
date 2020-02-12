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
	// Detect injection script. (Google provided code, duracelltomi-google-tag-manager, metronet-tag-manager (uses user-provided))
	/<script[^>]*>[^>]+?www.googletagmanager.com\/gtm[^>]+?['|"](GTM-[0-9A-Z]+)['|"]/,
	// Detect gtm.js script calls.
	/<script[^>]*src=['|"]https:\/\/www.googletagmanager.com\/gtm\.js\?id=(GTM-[0-9A-Z]+)['|"]/,
	// Detect iframe version for no-js.
	/<script[^>]*src=['|"]https:\/\/www.googletagmanager.com\/ns.html\?id=(GTM-[0-9A-Z]+)['|"]/,
	// Detect amp tag.
	/<amp-analytics [^>]*config=['|"]https:\/\/www.googletagmanager.com\/amp.json\?id=(GTM-[0-9A-Z]+)['|"]/,
];
