/**
 * Key Metrics Selection Panel Footer
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
import { SpinnerButton } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import {
	CORE_USER,
	KEY_METRICS_SELECTION_PANEL_OPENED_KEY,
} from '../../../googlesitekit/datastore/user/constants';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import Link from '../../Link';
import ErrorNotice from '../../ErrorNotice';
const { useSelect, useDispatch } = Data;

export default function Footer() {
	const selectedMetrics = useSelect( ( select ) =>
		select( CORE_USER ).getUserPickedMetrics()
	);
	const haveSettingsChanged = useSelect( ( select ) =>
		select( CORE_USER ).haveKeyMetricsSettingsChanged()
	);
	const isSavingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingKeyMetricsSettings()
	);
	const saveError = useSelect( ( select ) => {
		if ( haveSettingsChanged && selectedMetrics?.length < 2 ) {
			return {
				message: __( 'Select at least 2 metrics', 'google-site-kit' ),
			};
		}

		return select( CORE_USER ).getErrorForAction(
			'saveKeyMetricsSettings',
			[]
		);
	} );
	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	const { resetKeyMetricsSettings, saveKeyMetricsSettings } =
		useDispatch( CORE_USER );
	const { setValue } = useDispatch( CORE_UI );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const onSaveClick = useCallback( async () => {
		const { error } = await saveKeyMetricsSettings();

		if ( ! error ) {
			setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );
		}
	}, [ saveKeyMetricsSettings, setValue ] );

	const onCancelClick = useCallback( async () => {
		await resetKeyMetricsSettings();

		setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );
	}, [ resetKeyMetricsSettings, setValue ] );

	const onSettingsClick = useCallback(
		() => navigateTo( `${ settingsURL }#/admin-settings` ),
		[ navigateTo, settingsURL ]
	);

	return (
		<footer className="googlesitekit-km-selection-panel-footer">
			{ saveError && (
				<ErrorNotice
					error={ saveError }
					prefix={ selectedMetrics?.length < 2 ? false : undefined }
				/>
			) }
			<div className="googlesitekit-km-selection-panel-footer__actions">
				<SpinnerButton
					onClick={ onSaveClick }
					isSaving={ isSavingSettings }
					disabled={
						! haveSettingsChanged ||
						selectedMetrics?.length < 2 ||
						selectedMetrics?.length > 4 ||
						isSavingSettings
					}
				>
					{ __( 'Apply changes', 'google-site-kit' ) }
				</SpinnerButton>
				<Link onClick={ onCancelClick } disabled={ isSavingSettings }>
					{ __( 'Cancel', 'google-site-kit' ) }
				</Link>
			</div>
			<p className="googlesitekit-km-selection-panel-footer__note">
				{ createInterpolateElement(
					__(
						'Set your personalized goals or <br />deactivate this widget in <link><strong>Settings</strong></link>',
						'google-site-kit'
					),
					{
						br: <br />,
						link: (
							<Link
								onClick={ onSettingsClick }
								disabled={ isSavingSettings }
							/>
						),
						strong: <strong />,
					}
				) }
			</p>
		</footer>
	);
}
