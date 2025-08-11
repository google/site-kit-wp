/**
 * Key Metrics Selection Panel Header
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { MAX_SELECTED_METRICS_COUNT } from '../constants';
import Link from '../../Link';
import { SelectionPanelHeader } from '../../SelectionPanel';
import useViewOnly from '../../../hooks/useViewOnly';
import Typography from '../../Typography';

export default function Header( { closePanel } ) {
	const isViewOnly = useViewOnly();

	const adminSettingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getSiteKitAdminSettingsURL()
	);
	const isSavingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingKeyMetricsSettings()
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );

	const onSettingsClick = useCallback(
		() => navigateTo( adminSettingsURL ),
		[ adminSettingsURL, navigateTo ]
	);

	return (
		<SelectionPanelHeader
			title={ sprintf(
				/* translators: %d: number of max allowed metrics */
				__( 'Select up to %d metrics', 'google-site-kit' ),
				MAX_SELECTED_METRICS_COUNT
			) }
			onCloseClick={ closePanel }
		>
			{ ! isViewOnly && (
				<Typography as="p" size="medium" type="body">
					{ createInterpolateElement(
						__(
							'Edit your personalized goals or deactivate this widget in <link><strong>Settings</strong></link>',
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
				</Typography>
			) }
		</SelectionPanelHeader>
	);
}

Header.propTypes = {
	closePanel: PropTypes.func.isRequired,
};
