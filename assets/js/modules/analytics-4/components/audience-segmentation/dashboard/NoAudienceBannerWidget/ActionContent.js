/**
 * ActionContent component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useDispatch, useSelect } from 'googlesitekit-data';
import Link from '../../../../../../components/Link';
import { CORE_LOCATION } from '../../../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import useViewOnly from '../../../../../../hooks/useViewOnly';

export default function ActionContent( { hasConfigurableAudiences } ) {
	const isViewOnly = useViewOnly();

	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );

	function hideAudiencesWidget() {
		// TODO: dismiss item...
	}

	if ( isViewOnly ) {
		if ( ! hasConfigurableAudiences ) {
			return (
				<p>
					{ createInterpolateElement(
						__(
							'You can <a>temporarily hide</a> this feature until groups are available.',
							'google-site-kit'
						),
						{
							a: (
								<Link
									secondary
									onClick={ hideAudiencesWidget }
								/>
							),
						}
					) }
				</p>
			);
		}

		return null;
	}

	return (
		<p>
			{ createInterpolateElement(
				__(
					'You can deactivate this widget in <a>Settings</a>.',
					'google-site-kit'
				),
				{
					a: (
						<Link
							secondary
							onClick={ () =>
								navigateTo( `${ settingsURL }#/admin-settings` )
							}
						/>
					),
				}
			) }
		</p>
	);
}

ActionContent.propTypes = {
	hasConfigurableAudiences: PropTypes.bool.isRequired,
};
