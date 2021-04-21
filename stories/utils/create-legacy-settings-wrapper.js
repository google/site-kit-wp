/**
 * Legacy Settings Storybook component wrapper.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Internal dependencies
 */
import SettingsActiveModule from '../../assets/js/components/settings/SettingsActiveModule';
import { WithTestRegistry } from '../../tests/js/utils';

/**
 * Creates a legacy settings wrapper component for the given module.
 *
 * @since 1.12.0
 * @since 1.20.0 Removed `moduleComponent` argument (now provided via module registration).
 * @since 1.31.0 Reworked to support new setting components.
 * @private
 *
 * @param {string} moduleSlug The module's slug.
 * @return {Function} Legacy settings component.
 */
export default function createLegacySettingsWrapper( moduleSlug ) {
	return function SettingsLegacy( props ) {
		const {
			registry,
			callback,
			isEditing = false,
			isOpen = true,
			isSaving = false,
			error = undefined,
		} = props;

		return (
			<WithTestRegistry registry={ registry } callback={ callback }>
				<div style={ { background: 'white' } }>
					<SettingsActiveModule
						slug={ moduleSlug }
						onEdit={ () => {} }
						onConfirm={ () => {} }
						onCancel={ () => {} }
						onToggle={ () => {} }
						isEditing={ isEditing }
						isOpen={ isOpen }
						isSaving={ isSaving }
						isLocked={ false }
						error={ error }
					/>
				</div>
			</WithTestRegistry>
		);
	};
}
