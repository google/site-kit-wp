/**
 * DefaultSettingsSetupIncomplete component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import Link from '../Link';
import ModuleSettingsWarning from '../notifications/ModuleSettingsWarning.js';
import { Cell } from '../../material-components/layout';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';

export default function DefaultSettingsSetupIncomplete( { slug } ) {
	const storeName = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleStoreName( slug )
	);
	const adminReauthURL = useSelect( ( select ) =>
		select( storeName )?.getAdminReauthURL?.()
	);
	const requirementsError = useSelect( ( select ) =>
		select( CORE_MODULES )?.getCheckRequirementsError( slug )
	);

	return (
		<Cell size={ 12 }>
			<div className="googlesitekit-settings-module__fields-group googlesitekit-settings-module__fields-group--no-border">
				<ModuleSettingsWarning slug={ slug } />
			</div>

			<div className="googlesitekit-settings-module__fields-group-title">
				{ createInterpolateElement(
					__(
						'Setup incomplete: <a>continue module setup</a>',
						'google-site-kit'
					),
					{
						a: (
							<Link
								className="googlesitekit-settings-module__edit-button"
								href={ adminReauthURL }
								disabled={ requirementsError ? true : false }
							/>
						),
					}
				) }
			</div>
		</Cell>
	);
}

DefaultSettingsSetupIncomplete.propTypes = {
	slug: PropTypes.string.isRequired,
};
