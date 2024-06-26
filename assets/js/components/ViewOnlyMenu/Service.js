/**
 * ViewOnlyMenu > Service component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import {
	CORE_USER,
	PERMISSION_AUTHENTICATE,
} from '../../googlesitekit/datastore/user/constants';

export default function Service( { module } ) {
	const canAuthenticate = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_AUTHENTICATE )
	);

	const { name, owner } = useSelect(
		( select ) => select( CORE_MODULES ).getModule( module ) || {}
	);

	const Icon = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleIcon( module )
	);

	return (
		<li className="googlesitekit-view-only-menu__service">
			<span className="googlesitekit-view-only-menu__service--icon">
				<Icon height={ 26 } />
			</span>
			<span className="googlesitekit-view-only-menu__service--name">
				{ name }
			</span>
			{ canAuthenticate && owner?.login && (
				<span className="googlesitekit-view-only-menu__service--owner">
					{ createInterpolateElement(
						sprintf(
							/* translators: %s: module owner Google Account email address */
							__(
								'Shared by <strong>%s</strong>',
								'google-site-kit'
							),
							owner.login
						),
						{
							strong: <strong title={ owner.login } />,
						}
					) }
				</span>
			) }
		</li>
	);
}

Service.propTypes = {
	module: PropTypes.string.isRequired,
};
