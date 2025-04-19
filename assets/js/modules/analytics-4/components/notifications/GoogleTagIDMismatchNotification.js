/**
 * GoogleTagIDMismatchNotification component.
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
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { isValidMeasurementID } from '../../utils/validation';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { getBestTagID } from '../../utils/google-tag';
import SimpleNotification from '../../../../googlesitekit/notifications/components/layout/SimpleNotification';
import Description from '../../../../googlesitekit/notifications/components/common/Description';
import ActionsCTALinkDismiss from '../../../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';
import CTALink from '../../../../googlesitekit/notifications/components/common/CTALink';

export default function GoogleTagIDMismatchNotification( {
	id,
	Notification,
} ) {
	const currentAnalyticsConfig = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getSettings()
	);

	const googleTagContainerDestinations = useSelect(
		( select ) =>
			currentAnalyticsConfig?.googleTagAccountID &&
			currentAnalyticsConfig?.googleTagContainerID &&
			select( MODULES_ANALYTICS_4 ).getGoogleTagContainerDestinations(
				currentAnalyticsConfig.googleTagAccountID,
				currentAnalyticsConfig.googleTagContainerID
			)
	);

	const currentAnalyticsProperty = useSelect(
		( select ) =>
			currentAnalyticsConfig?.propertyID &&
			select( MODULES_ANALYTICS_4 ).getProperty(
				currentAnalyticsConfig.propertyID
			)
	);

	const newAnalyticsConfig = useSelect( ( select ) => {
		if ( ! Array.isArray( googleTagContainerDestinations ) ) {
			return null;
		}

		const destinationIDs = googleTagContainerDestinations.map(
			// eslint-disable-next-line sitekit/acronym-case
			( destination ) => destination.destinationId
		);

		const validGA4MeasurementIDs =
			destinationIDs.filter( isValidMeasurementID );

		if ( validGA4MeasurementIDs.length === 0 ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getAnalyticsConfigByMeasurementIDs(
			validGA4MeasurementIDs
		);
	} );

	const newAnalyticsProperty = useSelect(
		( select ) =>
			newAnalyticsConfig &&
			newAnalyticsConfig.propertyID &&
			select( MODULES_ANALYTICS_4 ).getProperty(
				newAnalyticsConfig?.propertyID
			)
	);

	const newGoogleTagID = useSelect( ( select ) => {
		const tagIDs =
			currentAnalyticsConfig?.measurementID &&
			select( MODULES_ANALYTICS_4 ).getGoogleTagContainer(
				currentAnalyticsConfig?.measurementID
			)?.tagIds; // eslint-disable-line sitekit/acronym-case

		if ( Array.isArray( tagIDs ) ) {
			return getBestTagID( tagIDs, currentAnalyticsConfig.measurementID );
		}
	} );

	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( CORE_MODULES ).isDoingSubmitChanges( 'analytics-4' )
	);

	const {
		setPropertyID,
		setWebDataStreamID,
		setMeasurementID,
		updateSettingsForMeasurementID,
		submitChanges,
		setHasMismatchedGoogleTagID,
	} = useDispatch( MODULES_ANALYTICS_4 );

	const updateToNewAnalyticsConfig = useCallback( async () => {
		setPropertyID( newAnalyticsConfig?.propertyID );
		setWebDataStreamID( newAnalyticsConfig?.webDataStreamID );
		setMeasurementID( newAnalyticsConfig?.measurementID );
		await submitChanges();
		setHasMismatchedGoogleTagID( false );
	}, [
		setPropertyID,
		setWebDataStreamID,
		setMeasurementID,
		newAnalyticsConfig?.propertyID,
		newAnalyticsConfig?.webDataStreamID,
		newAnalyticsConfig?.measurementID,
		submitChanges,
		setHasMismatchedGoogleTagID,
	] );

	const updateGoogleTagConfig = useCallback( async () => {
		await updateSettingsForMeasurementID(
			currentAnalyticsConfig?.measurementID
		);
		await submitChanges();
		setHasMismatchedGoogleTagID( false );
	}, [
		updateSettingsForMeasurementID,
		currentAnalyticsConfig?.measurementID,
		submitChanges,
		setHasMismatchedGoogleTagID,
	] );

	if (
		googleTagContainerDestinations === undefined ||
		newAnalyticsProperty === undefined ||
		newGoogleTagID === undefined ||
		currentAnalyticsProperty === undefined ||
		// If the current and new properties are the same, don't show the notification.
		// This can happen momentarily when the banner is actioned and the new property
		// has been saved, but the notification hasn't been dismissed / removed from the queue yet.
		( currentAnalyticsProperty?._id &&
			newAnalyticsProperty?._id &&
			currentAnalyticsProperty._id === newAnalyticsProperty._id )
	) {
		return null;
	}

	if ( newAnalyticsProperty ) {
		return (
			<Notification className="googlesitekit-publisher-win">
				<SimpleNotification
					title={ __(
						"Update Site Kit's Analytics configuration to continue seeing Analytics data on the dashboard",
						'google-site-kit'
					) }
					description={
						<Description
							text={ sprintf(
								/* translators: 1: Current GA4 property name. 2: Current GA4 property ID. 3: Newly linked GA4 property name. 4: Newly linked GA4 property ID. */
								__(
									'The Google Tag on your site is no longer associated with your current Google Analytics property "%1$s (%2$s)". It is now recording metrics to another Google Analytics property "%3$s (%4$s)". If you want to continue seeing Analytics data in the Site Kit dashboard, we suggest you update Site Kit’s Google Analytics configuration to show data for the property used in your Google Tag.',
									'google-site-kit'
								),
								currentAnalyticsProperty.displayName,
								currentAnalyticsProperty._id,
								newAnalyticsProperty.displayName,
								newAnalyticsProperty._id
							) }
						/>
					}
					actions={
						<ActionsCTALinkDismiss
							id={ id }
							ctaLabel={ __(
								'Use new property',
								'google-site-kit'
							) }
							onCTAClick={ updateToNewAnalyticsConfig }
							dismissOnCTAClick
							isSaving={ isDoingSubmitChanges }
							dismissLabel={ __(
								'Keep existing property',
								'google-site-kit'
							) }
							onDismiss={ updateGoogleTagConfig }
							dismissExpires={ 1 } // Expire the dismissal in a second to allow the notification to be shown on page reload if necessary.
							dismissOptions={ { skipHidingFromQueue: false } }
						/>
					}
				/>
			</Notification>
		);
	}

	if ( newGoogleTagID ) {
		return (
			<Notification className="googlesitekit-publisher-win">
				<SimpleNotification
					title={ __(
						'Your Google tag configuration has changed',
						'google-site-kit'
					) }
					description={
						<Description
							text={ sprintf(
								/* translators: 1: Currently set Google Tag ID. 2: Newly linked Google Tag ID. 3: Current GA4 property name. 4: Current GA4 property ID. */
								__(
									'The Google tag for your Google Analytics configuration has changed from %1$s to %2$s. To keep using your current Google Analytics property "%3$s (%4$s)", you need to configure Site Kit to place the new Google tag %2$s instead.',
									'google-site-kit'
								),
								currentAnalyticsConfig.googleTagID,
								newGoogleTagID,
								currentAnalyticsProperty.displayName,
								currentAnalyticsProperty._id
							) }
						/>
					}
					actions={
						<CTALink
							id={ id }
							ctaLabel={ sprintf(
								/* translators: %s: Newly linked Google Tag ID. */
								__(
									'Update Google tag to %s',
									'google-site-kit'
								),
								newGoogleTagID
							) }
							onCTAClick={ updateGoogleTagConfig }
							dismissOnCTAClick
							dismissExpires={ 1 } // Expire the dismissal in a second to allow the notification to be shown on page reload if necessary.
							dismissOptions={ { skipHidingFromQueue: false } }
						/>
					}
				/>
			</Notification>
		);
	}
}
