/**
 * DefaultModuleSettings component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
import ModuleSettings from './ModuleSettings';
import ModuleSettingsHeader from './ModuleSettingsHeader';
import ModuleSettingsBody from './ModuleSettingsBody';
import ModuleSettingsFooter from './ModuleSettingsFooter';
import ModuleSettingsContainer from './ModuleSettingsContainer';
const { useSelect } = Data;

function DefaultModuleSettings( props ) {
	const {
		slug,
		provides,
		onView,
		onEdit,
		onSave,
		canSave,
	} = props;

	const isOpen = useSelect( ( select ) => select( STORE_NAME ).isSettingsViewModuleOpen( slug ) );
	const isEdit = useSelect( ( select ) => select( STORE_NAME ).isSettingsViewModuleEditing( slug ) );
	const isSaving = false;

	let settingsComponent = null;
	if ( isOpen ) {
		if ( isEdit || isSaving ) {
			if ( onEdit ) {
				settingsComponent = onEdit();
			}
		} else if ( onView ) {
			settingsComponent = onView();
		}
	}

	return (
		<ModuleSettings slug={ slug }>
			<ModuleSettingsHeader slug={ slug } />
			{ isOpen &&
				<ModuleSettingsContainer slug={ slug }>
					<ModuleSettingsBody slug={ slug } allowEdit={ !! onEdit }>
						{ settingsComponent }
					</ModuleSettingsBody>

					<ModuleSettingsFooter
						slug={ slug }
						allowEdit={ !! onEdit }
						provides={ provides }
						onSave={ onSave }
						canSave={ canSave }
					/>
				</ModuleSettingsContainer>
			}
		</ModuleSettings>
	);
}

DefaultModuleSettings.propTypes = {
	slug: PropTypes.string.isRequired,
	provides: PropTypes.arrayOf( PropTypes.string ),
	onView: PropTypes.func,
	onEdit: PropTypes.func,
	onSave: PropTypes.func,
	canSave: PropTypes.bool,
};

DefaultModuleSettings.defaultProps = {
	provides: [],
	canSave: false,
};

export default DefaultModuleSettings;
