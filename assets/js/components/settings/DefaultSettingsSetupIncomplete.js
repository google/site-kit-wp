/**
 * DefaultSettingsSetupIncomplete component.
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
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Link from '../Link';
import ModuleSettingsWarning from '../legacy-notifications/module-settings-warning';
const { useSelect } = Data;

export default function DefaultSettingsSetupIncomplete( { slug } ) {
	const storeName = `modules/${ slug }`;
	const adminReauthURL = useSelect( ( select ) => select( storeName )?.getAdminReauthURL?.() );

	return (
		<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
			<ModuleSettingsWarning slug={ slug } />
			{ createInterpolateElement(
				sprintf(
					/* translators: %s: link with next step */
					__( 'Setup incomplete: %s', 'google-site-kit' ),
					`<a>${ __( 'continue module setup', 'google-site-kit' ) }</a>`
				),
				{
					a: <Link
						className="googlesitekit-settings-module__edit-button"
						onClick={ () => {
							global.location = adminReauthURL;
						} }
						inherit
					/>,
				}
			) }
		</div>
	);
}

DefaultSettingsSetupIncomplete.propTypes = {
	slug: PropTypes.string.isRequired,
};
