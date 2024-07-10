/**
 * RecoverableModules component.
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
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import CTA from './notifications/CTA';

export default function RecoverableModules( { moduleSlugs } ) {
	const moduleNames = useSelect( ( select ) => {
		const modules = select( CORE_MODULES ).getModules();

		if ( modules === undefined ) {
			return undefined;
		}

		return moduleSlugs.map( ( moduleSlug ) => modules[ moduleSlug ].name );
	} );

	if ( moduleNames === undefined ) {
		return null;
	}

	const description =
		moduleNames.length === 1
			? sprintf(
					/* translators: %s: Module name */
					__(
						'%s data was previously shared by an admin who no longer has access. Please contact another admin to restore it.',
						'google-site-kit'
					),
					moduleNames[ 0 ]
			  )
			: sprintf(
					/* translators: %s: List of module names */
					__(
						'The data for the following modules was previously shared by an admin who no longer has access: %s. Please contact another admin to restore it.',
						'google-site-kit'
					),
					moduleNames.join(
						_x( ', ', 'Recoverable modules', 'google-site-kit' )
					)
			  );

	return (
		<CTA
			title={ __( 'Data Unavailable', 'google-site-kit' ) }
			description={ description }
		/>
	);
}

RecoverableModules.propTypes = {
	moduleSlugs: PropTypes.arrayOf( PropTypes.string ).isRequired,
};
