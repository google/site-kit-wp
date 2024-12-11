/**
 * KeyMetricsSettingsSellProductsSubtleNotification component.
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
import { useIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useViewContext from '../../hooks/useViewContext';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import SubtleNotification from '../../googlesitekit/notifications/components/layout/SubtleNotification';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { USER_INPUT_LEGACY_SITE_PURPOSE_DISMISSED_ITEM_KEY } from './util/constants';
import { trackEvent } from '../../util';
import WarningSVG from '../../../svg/icons/warning.svg';

export default function KeyMetricsSettingsSellProductsSubtleNotification() {
	const viewContext = useViewContext();
	const { dismissItem } = useDispatch( CORE_USER );
	const [ isViewed, setIsViewed ] = useState( false );

	const notificationRef = useRef();
	const intersectionEntry = useIntersection( notificationRef, {
		threshold: 0.25,
	} );
	const inView = !! intersectionEntry?.intersectionRatio;

	// Track when the notification is viewed.
	useEffect( () => {
		if ( ! isViewed && inView ) {
			// Handle internal tracking.
			trackEvent(
				`${ viewContext }_kmw-settings-suggested-site-purpose-edit-notification`,
				'view_notification',
				'conversion_reporting'
			);

			setIsViewed( true );
		}
	}, [ isViewed, inView, viewContext ] );

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			USER_INPUT_LEGACY_SITE_PURPOSE_DISMISSED_ITEM_KEY
		)
	);

	const onDismiss = useCallback( async () => {
		await dismissItem( USER_INPUT_LEGACY_SITE_PURPOSE_DISMISSED_ITEM_KEY );
		// Handle internal tracking.
		trackEvent(
			`${ viewContext }_kmw-settings-suggested-site-purpose-edit-notification`,
			'confirm_notification',
			'conversion_reporting'
		);
	}, [ dismissItem ] );

	if ( isDismissed ) {
		return null;
	}

	return (
		<SubtleNotification
			ref={ notificationRef }
			className="googlesitekit-subtle-notification--warning"
			description={ __(
				'To allow better personalization of suggested metrics, we have updated the answers list for this question with more accurate options. We recommend that you edit your answer.',
				'google-site-kit'
			) }
			dismissCTA={
				<Button tertiary onClick={ onDismiss }>
					{ __( 'Got it', 'google-site-kit' ) }
				</Button>
			}
			icon={ <WarningSVG width={ 24 } height={ 24 } /> }
		/>
	);
}
