/**
 * Badge constants.
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
 * Semantic badge groups that inform how a `<Badge />` component is coloured.
 *
 * Each group covers the badges that tell the user the same kind of thing, so a
 * badge takes its colour from what it says rather than from where it appears.
 *
 * @since n.e.x.t
 */
export const enum BADGE_VARIANTS {
	/**
	 * Something is new, or not yet generally available.
	 */
	ANNOUNCEMENT = 'announcement',
	/**
	 * Site Kit suggests this to the user.
	 */
	RECOMMENDATION = 'recommendation',
	/**
	 * The service costs money to use.
	 */
	COST = 'cost',
	/**
	 * The feature is experimental.
	 */
	EXPERIMENTAL = 'experimental',
	/**
	 * Something needs the user's attention, or data is incomplete.
	 */
	WARNING = 'warning',
}
