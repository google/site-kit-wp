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
 * WordPress dependencies
 */
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from '../constants';
import Link from '../../Link';
import CloseIcon from '../../../../svg/icons/close.svg';
import useViewOnly from '../../../hooks/useViewOnly';
const { useSelect, useDispatch } = Data;

export default function Header() {
	const isViewOnly = useViewOnly();

	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);
	const isSavingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingKeyMetricsSettings()
	);

	const { setValue } = useDispatch( CORE_UI );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const onCloseClick = useCallback( () => {
		setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );
	}, [ setValue ] );

	const onSettingsClick = useCallback(
		() => navigateTo( `${ settingsURL }#/admin-settings` ),
		[ navigateTo, settingsURL ]
	);

	return (
		<header className="googlesitekit-km-selection-panel-header">
			<div className="googlesitekit-km-selection-panel-header__row">
				<h3>{ __( 'Select your metrics', 'google-site-kit' ) }</h3>
				<Link
					className="googlesitekit-km-selection-panel-header__close"
					onClick={ onCloseClick }
					linkButton
				>
					<CloseIcon width="15" height="15" />
				</Link>
			</div>
			{ ! isViewOnly && (
				<p>
					{ createInterpolateElement(
						__(
							'Edit your personalized goals or deactivate this widget in <link><strong>Settings</strong></link>',
							'google-site-kit'
						),
						{
							link: (
								<Link
									secondary
									onClick={ onSettingsClick }
									disabled={ isSavingSettings }
								/>
							),
							strong: <strong />,
						}
					) }
				</p>
			) }
		</header>
	);
}
