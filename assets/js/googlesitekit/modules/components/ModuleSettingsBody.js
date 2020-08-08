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
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
import ModuleSetupIncomplete from '../../../components/settings/module-setup-incomplete';
const { useSelect } = Data;

const ModuleSettingsBody = ( { slug, children } ) => {
	const isOpen = useSelect( ( select ) => select( STORE_NAME ).isSettingsOpen( slug ) );

	// Separate footer child and non-footer children.
	const childArray = Children.toArray( children );
	const footerChild = childArray.filter( ( child ) => child.type.name === 'ModuleSettingsFooter' );
	const nonFooterChildren = childArray.filter( ( child ) => child.type.name !== 'ModuleSettingsFooter' );

	return (
		<div
			className={ classnames(
				'googlesitekit-settings-module__content',
				{ 'googlesitekit-settings-module__content--open': isOpen }
			)
			}
			id={ `googlesitekit-settings-module__content--${ slug }` }
			role="tabpanel"
			aria-hidden={ ! isOpen }
			aria-labelledby={ `googlesitekit-settings-module__header--${ slug }` }
		>
			<div className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					{ setupComplete &&
					<Fragment>
						<div className={ classnames(
							'mdc-layout-grid__cell',
							'mdc-layout-grid__cell--span-12'
						) }>
							{ nonFooterChildren }
						</div>
					</Fragment>
					}
					{
						hasSettings && ! setupComplete &&
						<ModuleSetupIncomplete
							slug={ slug }
						/>
					}
				</div>
			</div>
			{ footerChild }
		</div>
	);
};

ModuleSettingsBody.propTypes = {
	slug: PropTypes.string.isRequired,
	children: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.node ),
		PropTypes.node,
	] ).isRequired,
};

export default ModuleSettingsBody;
