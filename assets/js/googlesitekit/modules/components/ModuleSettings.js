/**
 * ModuleSettings component.
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
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
import ModuleSettingsOverlay from './ModuleSettingsOverlay';
const { useSelect } = Data;

function ModuleSettings( { children, error, slug } ) {
	const isEditing = useSelect( ( select ) => select( STORE_NAME ).isSettingsViewEditingModule( slug ) );
	const isLocked = useSelect( ( select ) => select( STORE_NAME ).isSettingsViewModuleLocked( slug ) );

	return (
		<div className={ classnames(
			'googlesitekit-settings-module',
			'googlesitekit-settings-module--active',
			`googlesitekit-settings-module--${ slug }`,
			{ 'googlesitekit-settings-module--error': error && isEditing }
		) }>
			{ isLocked && <ModuleSettingsOverlay compress /> }
			{ children }
		</div>
	);
}

ModuleSettings.propTypes = {
	children: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.node ),
		PropTypes.node,
	] ).isRequired,
	slug: PropTypes.string.isRequired,
	error: PropTypes.bool,
};

ModuleSettings.defaultProps = {
	error: false,
};

export default ModuleSettings;
