/**
 * Audience Selection Panel Header
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
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_LOCATION } from '../../../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import useViewOnly from '../../../../../../hooks/useViewOnly';
import Link from '../../../../../../components/Link';
import P from '../../../../../../components/Typography/P';
import { SelectionPanelHeader } from '../../../../../../components/SelectionPanel';

export default function Header( { closePanel } ) {
	const isViewOnly = useViewOnly();

	const adminSettingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getSiteKitAdminSettingsURL()
	);
	const isSavingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingUserAudienceSettings()
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );

	const onSettingsClick = useCallback(
		() => navigateTo( adminSettingsURL ),
		[ adminSettingsURL, navigateTo ]
	);

	return (
		<SelectionPanelHeader
			title={ __( 'Select visitor groups', 'google-site-kit' ) }
			onCloseClick={ closePanel }
		>
			{ ! isViewOnly && (
				<P>
					{ createInterpolateElement(
						__(
							'You can deactivate this widget in <link><strong>Settings</strong></link>',
							'google-site-kit'
						),
						{
							link: (
								<Link
									onClick={ onSettingsClick }
									disabled={ isSavingSettings }
									secondary
								/>
							),
							strong: <strong />,
						}
					) }
				</P>
			) }
		</SelectionPanelHeader>
	);
}

Header.propTypes = {
	closePanel: PropTypes.func.isRequired,
};
