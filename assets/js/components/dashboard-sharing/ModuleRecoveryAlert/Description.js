/**
 * ModuleRecoveryAlert Description component.
 *
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
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';

export default function Description( {
	recoverableModules,
	userRecoverableModuleSlugs,
	hasUserRecoverableModules,
	hasMultipleRecoverableModules,
} ) {
	if ( ! hasMultipleRecoverableModules && hasUserRecoverableModules ) {
		return sprintf(
			/* translators: %s: module name. */
			__(
				'%s data was previously shared with other users on the site by another admin who no longer has access. To restore access, you may recover the module as the new owner.',
				'google-site-kit'
			),
			recoverableModules[ userRecoverableModuleSlugs[ 0 ] ]?.name
		);
	}

	if ( hasMultipleRecoverableModules && hasUserRecoverableModules ) {
		return __(
			'The data for the following modules was previously shared with other users on the site by another admin who no longer has access. To restore access, you may recover the module as the new owner.',
			'google-site-kit'
		);
	}

	if (
		! hasMultipleRecoverableModules &&
		! hasUserRecoverableModules &&
		recoverableModules
	) {
		return sprintf(
			/* translators: %s: module name. */
			__(
				'%s data was previously shared with other users on the site by another admin who no longer has access. To restore access, the module must be recovered by another admin who has access.',
				'google-site-kit'
			),
			Object.values( recoverableModules )[ 0 ]?.name
		);
	}

	if ( hasMultipleRecoverableModules && ! hasUserRecoverableModules ) {
		return __(
			'The data for the following modules was previously shared with other users on the site by another admin who no longer has access. To restore access, the module must be recovered by another admin who has access.',
			'google-site-kit'
		);
	}
}
