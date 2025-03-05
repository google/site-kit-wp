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
 * Gets the block editor button's notice and disabled state based on the provided options.
 *
 * @since n.e.x.t
 *
 * @param {Object}  options                                               Options object.
 * @param {string}  options.paymentOption                                 Payment option.
 * @param {string}  options.requiredPaymentOption                         Required payment option.
 * @param {boolean} options.hasModuleAccess                               Whether the user has module access.
 * @param {string}  options.postProductID                                 Post product ID.
 * @param {string}  options.snippetMode                                   Snippet mode.
 * @param {Array}   options.postTypes                                     Post types.
 * @param {string}  options.postType                                      Post type.
 * @param {string}  options.invalidPaymentOptionWithModuleAccessNotice    Notice for invalid payment option with module access.
 * @param {string}  options.invalidPaymentOptionWithoutModuleAccessNotice Notice for invalid payment option without module access.
 * @param {string}  options.noSnippetWithModuleAccessNotice               Notice for no snippet with module access.
 * @param {string}  options.noSnippetWithoutModuleAccessNotice            Notice for no snippet without module access.
 * @return {Object} Object with disabled and notice properties.
 */
export function getNoticeAndDisabled( {
	paymentOption,
	requiredPaymentOption,
	hasModuleAccess,
	postProductID,
	snippetMode,
	postTypes,
	postType,
	invalidPaymentOptionWithModuleAccessNotice,
	invalidPaymentOptionWithoutModuleAccessNotice,
	noSnippetWithModuleAccessNotice,
	noSnippetWithoutModuleAccessNotice,
} ) {
	if ( paymentOption !== requiredPaymentOption ) {
		return {
			disabled: true,
			notice: hasModuleAccess
				? invalidPaymentOptionWithModuleAccessNotice
				: invalidPaymentOptionWithoutModuleAccessNotice,
		};
	}

	if (
		postProductID === 'none' ||
		( ! postProductID && snippetMode === 'per_post' ) ||
		( ! postProductID &&
			snippetMode === 'post_types' &&
			! postTypes.includes( postType ) )
	) {
		return {
			disabled: true,
			notice: hasModuleAccess
				? noSnippetWithModuleAccessNotice
				: noSnippetWithoutModuleAccessNotice,
		};
	}

	return {
		disabled: false,
		notice: null,
	};
}
