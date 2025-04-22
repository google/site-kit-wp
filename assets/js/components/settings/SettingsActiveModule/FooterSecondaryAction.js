/**
 * FooterSecondaryAction component for SettingsActiveModule.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Link from '../../Link';
import TrashIcon from '../../../../svg/icons/trash.svg';

export default function FooterSecondaryAction( {
	isEditing,
	forceActive,
	moduleHomepage,
	name,
	handleDialog,
} ) {
	if ( isEditing && ! forceActive ) {
		return (
			<Link
				className="googlesitekit-settings-module__remove-button"
				onClick={ handleDialog }
				danger
				trailingIcon={
					<TrashIcon
						className="googlesitekit-settings-module__remove-button-icon"
						width={ 13 }
						height={ 13 }
					/>
				}
			>
				{ sprintf(
					/* translators: %s: module name */
					__( 'Disconnect %s from Site Kit', 'google-site-kit' ),
					name
				) }
			</Link>
		);
	}

	if ( ! isEditing && moduleHomepage ) {
		return (
			<Link
				href={ moduleHomepage }
				className="googlesitekit-settings-module__cta-button"
				external
			>
				{ sprintf(
					/* translators: %s: module name */
					__( 'See full details in %s', 'google-site-kit' ),
					name
				) }
			</Link>
		);
	}

	return null;
}
