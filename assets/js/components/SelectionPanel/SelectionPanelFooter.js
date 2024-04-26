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
	useEffect,
	useState,
	useMemo,
	createInterpolateElement,
} from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import {
	SELECTION_PANEL_OPENED_KEY,
	SELECTION_PANEL_SELECTED_ITEMS,
	SELECTION_PANEL_FORM,
	MIN_SELECTED_COUNT,
	MAX_SELECTED_COUNT,
} from './constants';
import { EDIT_SCOPE } from '../../modules/analytics-4/datastore/constants';
import ErrorNotice from '../ErrorNotice';
import { safelySort } from './utils';

const { useSelect } = Data;

export default function SelectionPanelFooter( {
	savedMetrics = [],
	onSaveClick = () => {},
	onCancelClick = () => {},
} ) {
	const selectedMetrics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			SELECTION_PANEL_FORM,
			SELECTION_PANEL_SELECTED_ITEMS
		)
	);
	const keyMetricsSettings = useSelect( ( select ) =>
		select( CORE_USER ).getKeyMetricsSettings()
	);
	const isSavingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingKeyMetricsSettings()
	);

	const haveSettingsChanged = useMemo( () => {
		// Arrays need to be sorted to match in `isEqual`.
		return ! isEqual(
			safelySort( selectedMetrics ),
			safelySort( savedMetrics )
		);
	}, [ savedMetrics, selectedMetrics ] );

	const saveError = useSelect( ( select ) =>
		select( CORE_USER ).getErrorForAction( 'saveKeyMetricsSettings', [
			{
				...keyMetricsSettings,
				widgetSlugs: selectedMetrics,
			},
		] )
	);

	// The `custom_dimensions` query value is arbitrary and serves two purposes:
	// 1. To ensure that `authentication_success` isn't appended when returning from OAuth.
	// 2. To guarantee it doesn't match any existing notifications in the `BannerNotifications` component, thus preventing any unintended displays.
	const redirectURL = addQueryArgs( global.location.href, {
		notification: 'custom_dimensions',
	} );

	const isNavigatingToOAuthURL = useSelect( ( select ) => {
		const OAuthURL = select( CORE_USER ).getConnectURL( {
			additionalScopes: [ EDIT_SCOPE ],
			redirectURL,
		} );

		if ( ! OAuthURL ) {
			return false;
		}

		return select( CORE_LOCATION ).isNavigatingTo( OAuthURL );
	} );

	const isOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( SELECTION_PANEL_OPENED_KEY )
	);

	const [ finalButtonText, setFinalButtonText ] = useState( null );
	const [ wasSaved, setWasSaved ] = useState( false );

	const currentButtonText =
		savedMetrics?.length > 0 && haveSettingsChanged
			? __( 'Apply changes', 'google-site-kit' )
			: __( 'Save selection', 'google-site-kit' );

	const [ prevIsOpen, setPrevIsOpen ] = useState( null );

	useEffect( () => {
		if ( prevIsOpen !== null ) {
			// if current isOpen is true, and different from prevIsOpen
			// meaning it transitioned from false to true and it is not
			// in closing transition, we should reset the button label
			// locked when save button was clicked
			if ( prevIsOpen !== isOpen ) {
				if ( isOpen ) {
					setFinalButtonText( null );
					setWasSaved( false );
				}
			}
		}

		setPrevIsOpen( isOpen );
	}, [ isOpen, prevIsOpen ] );

	const selectedMetricsCount = selectedMetrics?.length || 0;
	let metricsLimitError;
	if ( selectedMetricsCount < MIN_SELECTED_COUNT ) {
		metricsLimitError = sprintf(
			/* translators: 1: Minimum number of metrics that can be selected. 2: Number of selected metrics. */
			__(
				'Select at least %1$d metrics (%2$d selected)',
				'google-site-kit'
			),
			MIN_SELECTED_COUNT,
			selectedMetricsCount
		);
	} else if ( selectedMetricsCount > MAX_SELECTED_COUNT ) {
		metricsLimitError = sprintf(
			/* translators: 1: Maximum number of metrics that can be selected. 2: Number of selected metrics. */
			__(
				'Select up to %1$d metrics (%2$d selected)',
				'google-site-kit'
			),

			MAX_SELECTED_COUNT,
			selectedMetricsCount
		);
	}

	return (
		<footer className="googlesitekit-km-selection-panel-footer">
			{ saveError && <ErrorNotice error={ saveError } /> }
			<div className="googlesitekit-km-selection-panel-footer__content">
				{ haveSettingsChanged && metricsLimitError ? (
					<ErrorNotice
						error={ {
							message: metricsLimitError,
						} }
						noPrefix={
							selectedMetricsCount < MIN_SELECTED_COUNT ||
							selectedMetricsCount > MAX_SELECTED_COUNT
						}
					/>
				) : (
					<p className="googlesitekit-km-selection-panel-footer__metric-count">
						{ createInterpolateElement(
							sprintf(
								/* translators: 1: Number of selected metrics. 2: Maximum number of metrics that can be selected. */
								__(
									'%1$d selected <MaxCount>(up to %2$d)</MaxCount>',
									'google-site-kit'
								),
								selectedMetricsCount,
								MAX_SELECTED_COUNT
							),
							{
								MaxCount: (
									<span className="googlesitekit-km-selection-panel-footer__metric-count--max-count" />
								),
							}
						) }
					</p>
				) }
				<div className="googlesitekit-km-selection-panel-footer__actions">
					<Button
						tertiary
						onClick={ onCancelClick }
						disabled={ isSavingSettings || isNavigatingToOAuthURL }
					>
						{ __( 'Cancel', 'google-site-kit' ) }
					</Button>
					<SpinnerButton
						onClick={ onSaveClick }
						isSaving={ isSavingSettings || isNavigatingToOAuthURL }
						disabled={
							selectedMetricsCount < MIN_SELECTED_COUNT ||
							selectedMetricsCount > MAX_SELECTED_COUNT ||
							isSavingSettings ||
							( ! isOpen && wasSaved ) ||
							isNavigatingToOAuthURL
						}
					>
						{ finalButtonText || currentButtonText }
					</SpinnerButton>
				</div>
			</div>
		</footer>
	);
}

SelectionPanelFooter.propTypes = {
	savedMetrics: PropTypes.array,
	onNavigationToOAuthURL: PropTypes.func,
};
