/**
 * Widget's modules utility.
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

/**
 * Normalizes widget's modules by converting it to an array and filtering out all non-string values.
 *
 * @since 1.71.0
 *
 * @param {string|Array.<string>} modules Widget's mdoules.
 * @return {Array.<string>} Widget's modules list.
 */
export function normalizeWidgetModules( modules ) {
	return ( Array.isArray( modules ) ? modules : [ modules ] ).filter(
		( module ) => typeof module === 'string' && module.length > 0
	);
}
