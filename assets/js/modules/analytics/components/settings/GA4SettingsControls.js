/**
 * Analytics-4 Settings controls.
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
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { FORM_SETUP, MODULES_ANALYTICS } from '../../datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { AccountSelect, GA4ActivateSwitch } from '../common';
import {
	PropertySelect,
	WebDataStreamSelect,
} from '../../../analytics-4/components/common';
import SettingsEnhancedMeasurementSwitch from '../../../analytics-4/components/settings/SettingsEnhancedMeasurementSwitch';
import SettingsUseSnippetSwitch from '../../../analytics-4/components/settings/SettingsUseSnippetSwitch';
import JoyrideTooltip from '../../../../components/JoyrideTooltip';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import GA4SettingsNotice from './GA4SettingsNotice';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import PropertyOrWebDataStreamNotAvailableError from './PropertyOrWebDataStreamNotAvailableError';
const { useSelect, useDispatch } = Data;

export default function GA4SettingsControls( props ) {
	const { hasAnalyticsAccess, hasAnalytics4Access } = props;

	const viewContext = useViewContext();

	const { setValues } = useDispatch( CORE_FORMS );
	const { matchAndSelectProperty } = useDispatch( MODULES_ANALYTICS_4 );

	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);

	const enableGA4 = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'enableGA4' )
	);
	const enableGA4PropertyTooltip = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'enableGA4PropertyTooltip' )
	);

	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	const isModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'ga4' )
	);

	const onActivate = useCallback( () => {
		matchAndSelectProperty( accountID );
	}, [ matchAndSelectProperty, accountID ] );

	const eventCategory = `${ viewContext }_ga4-setup`;

	const onViewTooltip = useCallback( () => {
		trackEvent( eventCategory, 'feature_tooltip_view' );
	}, [ eventCategory ] );

	const onDismissTooltip = useCallback( () => {
		trackEvent( eventCategory, 'feature_tooltip_dismiss' );

		setValues( FORM_SETUP, {
			enableGA4PropertyTooltip: false,
		} );
	}, [ eventCategory, setValues ] );

	const toggleDocumentClass = useCallback( () => {
		global.document.body.classList.toggle(
			'googlesitekit--has-visible-tooltip'
		);
	}, [] );

	const isDisabled = ! propertyID && ! enableGA4;
	const hasModuleAccess = hasAnalyticsAccess && hasAnalytics4Access;

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<h4 className="googlesitekit-settings-module__fields-group-title">
				{ __( 'Google Analytics 4', 'google-site-kit' ) }
			</h4>
			<StoreErrorNotices
				moduleSlug="analytics-4"
				storeName={ MODULES_ANALYTICS_4 }
			/>
			<PropertyOrWebDataStreamNotAvailableError
				hasModuleAccess={ hasModuleAccess }
				isDisabled={ isDisabled }
			/>
			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect hasModuleAccess={ hasModuleAccess } />
				<PropertySelect
					hasModuleAccess={ hasModuleAccess }
					isDisabled={ isDisabled }
					onChange={ () =>
						enableGA4PropertyTooltip &&
						setValues( FORM_SETUP, {
							enableGA4PropertyTooltip: false,
						} )
					}
				/>

				<WebDataStreamSelect
					hasModuleAccess={ hasModuleAccess }
					isDisabled={ isDisabled }
				/>

				{ ! isDisabled &&
					! isModuleConnected &&
					enableGA4PropertyTooltip &&
					hasModuleAccess && (
						<JoyrideTooltip
							title={ __(
								'Set up your Google Analytics 4 property here',
								'google-site-kit'
							) }
							styles={ {
								options: {
									zIndex: 10,
								},
							} }
							target=".googlesitekit-analytics-4__select-property--loaded"
							onDismiss={ onDismissTooltip }
							cta={
								<Button
									className="googlesitekit-tooltip-button"
									href={ documentationURL }
									target="_blank"
									text
								>
									{ __( 'Learn more', 'google-site-kit' ) }
								</Button>
							}
							onView={ onViewTooltip }
							onTourStart={ toggleDocumentClass }
							onTourEnd={ toggleDocumentClass }
						/>
					) }
			</div>

			<GA4SettingsNotice
				isGA4Connected={ isModuleConnected }
				hasAnalyticsAccess={ hasAnalyticsAccess }
				hasAnalytics4Access={ hasAnalytics4Access }
			/>

			{ isDisabled && (
				<GA4ActivateSwitch
					disabled={ ! hasAnalyticsAccess }
					onActivate={ onActivate }
				/>
			) }

			{ ! isDisabled && (
				<div className="googlesitekit-settings-module__meta-item">
					<SettingsUseSnippetSwitch />
				</div>
			) }

			<SettingsEnhancedMeasurementSwitch
				hasAnalytics4Access={ hasAnalytics4Access }
			/>
		</div>
	);
}

// eslint-disable-next-line sitekit/acronym-case
GA4SettingsControls.propTypes = {
	hasAnalyticsAccess: PropTypes.bool,
	hasAnalytics4Access: PropTypes.bool,
};
