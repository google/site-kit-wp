/**
 * Legacy Settings Storybook component wrapper.
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

/**
 * Internal dependencies
 */
import SettingsModule from '../../assets/js/components/settings/settings-module';
import { WithTestRegistry } from '../../tests/js/utils';

/**
 * Creates a legacy settings wrapper component for the given module.
 *
 * @since 1.12.0
 * @since n.e.x.t Removed `moduleComponent` argument (now provided via module registration).
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
			module = {
				...global._googlesitekitLegacyData.modules[ moduleSlug ],
				active: true,
				setupComplete: true,
			},
			isEditing = false,
			isOpen = true,
			isSaving = false,
			error = false,
			handleAccordion = global.console.log.bind( null, 'handleAccordion' ),
			handleDialog = global.console.log.bind( null, 'handleDialog' ),
			updateModulesList = global.console.log.bind( null, 'updateModulesList' ),
			handleButtonAction = global.console.log.bind( null, 'handleButtonAction' ),
		} = props;

		const moduleKey = `${ moduleSlug }-module`;

		return (
			<WithTestRegistry registry={ registry } callback={ callback }>
				<div style={ { background: 'white' } }>
					<SettingsModule
						key={ moduleKey }
						slug={ moduleSlug }
						name={ module.name }
						description={ module.description }
						homepage={ module.homepage }
						learnmore={ module.learnMore }
						active={ module.active }
						setupComplete={ module.setupComplete }
						hasSettings={ !! module.settings && 'search-console' !== moduleSlug }
						autoActivate={ module.autoActivate }
						updateModulesList={ updateModulesList }
						handleEdit={ handleButtonAction }
						handleConfirm
						isEditing={ isEditing ? { [ moduleKey ]: true } : {} }
						isOpen={ isOpen }
						handleAccordion={ handleAccordion }
						handleDialog={ handleDialog }
						provides={ module.provides }
						isSaving={ isSaving }
						screenID={ module.screenID }
						error={ error }
					/>
				</div>
			</WithTestRegistry>
		);
	};
}
