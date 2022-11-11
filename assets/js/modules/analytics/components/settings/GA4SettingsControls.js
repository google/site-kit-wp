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
import { useUpdateEffect } from 'react-use';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { Fragment, useState, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button, ProgressBar } from 'googlesitekit-components';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
	WEBDATASTREAM_CREATE,
} from '../../../analytics-4/datastore/constants';
import { FORM_SETUP, MODULES_ANALYTICS } from '../../datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { Select, Option } from '../../../../material-components';
import { GA4ActivateSwitch } from '../common';
import { PropertySelect } from '../../../analytics-4/components/common';
import SettingsUseSnippetSwitch from '../../../analytics-4/components/settings/SettingsUseSnippetSwitch';
import JoyrideTooltip from '../../../../components/JoyrideTooltip';
import GA4SettingsNotice from './GA4SettingsNotice';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
const { useSelect, useDispatch } = Data;

export default function GA4SettingsControls( {
	hasAnalyticsAccess,
	hasAnalytics4Access,
} ) {
	const [ matchedProperty, setMatchedProperty ] = useState();
	const [ matchedWebDataStream, setMatchedWebDataStream ] = useState();

	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);

	// This select is needed to check whether the AdminAPI works or not.
	const properties = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getProperties( accountID )
	);
	const isAdminAPIWorking = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isAdminAPIWorking()
	);
	const enableGA4 = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'enableGA4' )
	);
	const enableGA4PropertyTooltip = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'enableGA4PropertyTooltip' )
	);
	const { setValues } = useDispatch( CORE_FORMS );

	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( 'analytics-4' )
	);

	const isModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'ga4' )
	);

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const hasModuleAccess =
		isGA4Connected && hasAnalyticsAccess && hasAnalytics4Access;

	const formattedOwnerName = module?.owner?.login
		? `<strong>${ module.owner.login }</strong>`
		: __( 'Another admin', 'google-site-kit' );

	const {
		matchAccountProperty,
		matchWebDataStream,
		setPropertyID,
		setWebDataStreamID,
		setMeasurementID,
	} = useDispatch( MODULES_ANALYTICS_4 );

	useUpdateEffect( () => {
		const matchGA4Information = async () => {
			const matchingProperty = await matchAccountProperty( accountID );

			setMatchedProperty( matchingProperty );
			if ( matchingProperty?._id ) {
				const matchingWebDataStream = await matchWebDataStream(
					matchingProperty._id
				);
				setMatchedWebDataStream( matchingWebDataStream );
			}
		};

		if ( isAdminAPIWorking ) {
			setMatchedProperty( undefined );
			setMatchedWebDataStream( undefined );
			matchGA4Information();
		}
	}, [
		accountID,
		matchAccountProperty,
		matchWebDataStream,
		isAdminAPIWorking,
	] );

	const onActivate = useCallback( () => {
		const hasProperties = properties?.length > 0;
		const defaultProperty = hasProperties ? '' : PROPERTY_CREATE;
		const defaultWebDataStream = hasProperties ? '' : WEBDATASTREAM_CREATE;

		const { _id: newPropertyID = defaultProperty } = matchedProperty || {};
		const { _id: newWebDataStreamID = defaultWebDataStream } =
			matchedWebDataStream || {};

		setPropertyID( newPropertyID );
		setWebDataStreamID( newWebDataStreamID );
		setMeasurementID(
			// eslint-disable-next-line sitekit/acronym-case
			matchedWebDataStream?.webStreamData.measurementId || ''
		);
	}, [
		properties,
		matchedProperty,
		matchedWebDataStream,
		setPropertyID,
		setWebDataStreamID,
		setMeasurementID,
	] );

	const isDisabled = ! propertyID && ! enableGA4;

	useEffect( () => {
		// Ensure preselection of the GA4 property works when navigating from the "Connect Google Analytics 4" CTA button.
		if (
			enableGA4 &&
			! propertyID &&
			matchedProperty &&
			matchedWebDataStream
		) {
			onActivate();
		}
	}, [
		enableGA4,
		matchedProperty,
		matchedWebDataStream,
		onActivate,
		propertyID,
	] );

	if ( isAdminAPIWorking === undefined ) {
		return <ProgressBar height={ isDisabled ? 180 : 212 } small />;
	}

	if ( ! isAdminAPIWorking ) {
		return null;
	}

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<div className="googlesitekit-setup-module__inputs">
				{ ! isDisabled && (
					<Fragment>
						<PropertySelect
							label={ __(
								'Google Analytics 4 Property',
								'google-site-kit'
							) }
							hasModuleAccess={ hasModuleAccess }
							onChange={ () =>
								enableGA4PropertyTooltip &&
								setValues( FORM_SETUP, {
									enableGA4PropertyTooltip: false,
								} )
							}
						/>

						{ ! isModuleConnected &&
							enableGA4PropertyTooltip &&
							hasModuleAccess && (
								<JoyrideTooltip
									title={ __(
										'Set up your Google Analytics 4 property here',
										'google-site-kit'
									) }
									target=".googlesitekit-analytics-4__select-property"
									onDismiss={ () =>
										setValues( FORM_SETUP, {
											enableGA4PropertyTooltip: false,
										} )
									}
									cta={
										<Button
											className="googlesitekit-tooltip-button"
											href={ documentationURL }
											target="_blank"
											text
										>
											{ __(
												'Learn more',
												'google-site-kit'
											) }
										</Button>
									}
								/>
							) }
					</Fragment>
				) }
				{ isDisabled && (
					<Select
						className="googlesitekit-analytics__select-property"
						label={ __(
							'Google Analytics 4 Property',
							'google-site-kit'
						) }
						value={ matchedProperty?._id || '' }
						disabled
						enhanced
						outlined
					>
						<Option value={ matchedProperty?._id || '' }>
							{ ! matchedProperty?._id ||
							! matchedProperty?.displayName
								? ''
								: sprintf(
										/* translators: 1: Property name. 2: Property ID. */
										_x(
											'%1$s (%2$s)',
											'Analytics property name and ID',
											'google-site-kit'
										),
										matchedProperty.displayName,
										matchedProperty._id
								  ) }
						</Option>
					</Select>
				) }
			</div>

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

			<GA4SettingsNotice
				isGA4Connected={ isGA4Connected }
				hasAnalyticsAccess={ hasAnalyticsAccess }
				hasAnalytics4Access={ hasAnalytics4Access }
				ownerName={ formattedOwnerName }
			/>
		</div>
	);
}

// eslint-disable-next-line sitekit/acronym-case
GA4SettingsControls.propTypes = {
	hasAnalyticsAccess: PropTypes.bool,
	hasAnalytics4Access: PropTypes.bool,
};
