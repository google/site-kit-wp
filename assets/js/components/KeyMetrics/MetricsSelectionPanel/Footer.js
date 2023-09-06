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
 * External dependencies
 */
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	useCallback,
	useMemo,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	KEY_METRICS_SELECTION_PANEL_OPENED_KEY,
	KEY_METRICS_SELECTED,
	KEY_METRICS_SELECTION_FORM,
} from '../constants';
import Link from '../../Link';
import ErrorNotice from '../../ErrorNotice';
import { safelySort } from './utils';
const { useSelect, useDispatch } = Data;

export default function Footer( { savedMetrics } ) {
	const selectedMetrics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			KEY_METRICS_SELECTION_FORM,
			KEY_METRICS_SELECTED
		)
	);
	const keyMetricsSettings = useSelect( ( select ) =>
		select( CORE_USER ).getKeyMetricsSettings()
	);
	const isSavingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingKeyMetricsSettings()
	);

	const haveSettingsChanged = useMemo( () => {
		// arrays need to be sorted to match in isEqual, otherwise check will fail
		return ! isEqual(
			safelySort( selectedMetrics ),
			safelySort( savedMetrics )
		);
	}, [ savedMetrics, selectedMetrics ] );

	const saveError = useSelect( ( select ) => {
		if ( haveSettingsChanged && selectedMetrics?.length < 2 ) {
			return {
				message: __( 'Select at least 2 metrics', 'google-site-kit' ),
			};
		}

		return select( CORE_USER ).getErrorForAction(
			'saveKeyMetricsSettings',
			[
				{
					...keyMetricsSettings,
					widgetSlugs: selectedMetrics,
				},
			]
		);
	} );
	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	const { saveKeyMetricsSettings } = useDispatch( CORE_USER );
	const { setValue } = useDispatch( CORE_UI );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const onSaveClick = useCallback( async () => {
		const { error } = await saveKeyMetricsSettings( {
			widgetSlugs: selectedMetrics,
		} );

		if ( ! error ) {
			setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );
		}
	}, [ saveKeyMetricsSettings, selectedMetrics, setValue ] );

	const onCancelClick = useCallback( () => {
		setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );
	}, [ setValue ] );

	const onSettingsClick = useCallback(
		() => navigateTo( `${ settingsURL }#/admin-settings` ),
		[ navigateTo, settingsURL ]
	);

	return (
		<footer className="googlesitekit-km-selection-panel-footer">
			{ saveError && (
				<ErrorNotice
					error={ saveError }
					noPrefix={ selectedMetrics?.length < 2 }
				/>
			) }
			<div className="googlesitekit-km-selection-panel-footer__actions">
				<SpinnerButton
					onClick={ onSaveClick }
					isSaving={ isSavingSettings }
					disabled={
						selectedMetrics?.length < 2 ||
						selectedMetrics?.length > 4 ||
						isSavingSettings
					}
				>
					{ savedMetrics?.length > 0 && haveSettingsChanged
						? __( 'Apply changes', 'google-site-kit' )
						: __( 'Save selection', 'google-site-kit' ) }
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

Footer.propTypes = {
	savedMetrics: PropTypes.array,
};
