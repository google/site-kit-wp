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
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
const { useSelect } = Data;

function ModuleSettingsContainer( { children, slug } ) {
	const isOpen = useSelect( ( select ) => select( STORE_NAME ).isSettingsViewModuleOpen( slug ) );

	return (
		<div
			id={ `googlesitekit-settings-module__content--${ slug }` }
			className={ classnames(
				'googlesitekit-settings-module__content',
				{ 'googlesitekit-settings-module__content--open': isOpen }
			) }
			role="tabpanel"
			aria-hidden={ ! isOpen }
			aria-labelledby={ `googlesitekit-settings-module__header--${ slug }` }
		>
			{ children }
		</div>
	);
}

ModuleSettingsContainer.propTypes = {
	slug: PropTypes.string.isRequired,
	children: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.node ),
		PropTypes.node,
	] ).isRequired,
};

export default ModuleSettingsContainer;
