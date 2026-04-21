/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Notice types that inform how a `<Notice />` component is styled.
 */
export const enum TYPES {
	NEW = 'new',
	SUCCESS = 'success',
	WARNING = 'warning',
	/**
	 * Grey background, the default for `'info'` notices.
	 */
	INFO = 'info',
	/**
	 * White background alternative for `'info'` notices.
	 */
	INFO_ALT = 'info-alt',
	/**
	 * Black background alternative for `'info'` notices.
	 */
	INFO_ALT_2 = 'info-alt-2',
	ERROR = 'error',
}
