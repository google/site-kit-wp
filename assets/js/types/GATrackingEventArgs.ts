/**
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
 * Tracking event arguments for Google Analytics tracking
 * events.
 *
 * @since n.e.x.t
 */
// eslint-disable-next-line sitekit/acronym-case
export interface GATrackingEventArgs {
	/**
	 * The category of the event, e.g. `'new_feature_tour'`.
	 */
	category?: string;
	/**
	 * The action of the event, e.g. `'confirm_cta'`.
	 */
	action?: string;
	/**
	 * The label of the event, e.g. `'start_tour'`.
	 */
	label?: string;
	/**
	 * The value of the event.
	 */
	value?: string | number;
}
