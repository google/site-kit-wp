/**
 * ModuleSettingsBody component.
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
import ModuleSetupIncomplete from '../../../components/settings/module-setup-incomplete';
const { useSelect } = Data;

function ModuleSettingsBody( { allowEdit, children, slug } ) {
	const isConnected = useSelect( ( select ) => select( STORE_NAME ).isModuleConnected( slug ) );

	return (
		<div className="mdc-layout-grid">
			<div className="mdc-layout-grid__inner">
				{ isConnected && (
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
						{ children }
					</div>
				) }
				{ allowEdit && ! isConnected && (
					<ModuleSetupIncomplete slug={ slug } />
				) }
			</div>
		</div>
	);
}

ModuleSettingsBody.propTypes = {
	slug: PropTypes.string.isRequired,
	allowEdit: PropTypes.bool,
	children: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.node ),
		PropTypes.node,
	] ),
};

ModuleSettingsBody.defaultProps = {
	allowEdit: false,
};

export default ModuleSettingsBody;
