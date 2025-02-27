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
