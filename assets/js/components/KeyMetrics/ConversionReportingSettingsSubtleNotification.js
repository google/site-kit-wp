/**
 * ConversionReportingSettingsSubtleNotification component.
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
import { useState, useCallback, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import Notice from '../../components/Notice';
import { Grid, Cell, Row } from '../../material-components';

export default function ConversionReportingSettingsSubtleNotification() {
	const viewContext = useViewContext();
	const [ isNavigating, setIsNavigating ] = useState( false );
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
				`${ viewContext }_kmw-settings-change-from-manual-to-tailored`,
				'view_notification',
				'conversion_reporting'
			);

			setIsViewed( true );
		}
	}, [ isViewed, inView, viewContext ] );

	const userInputURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-user-input' )
	);

	const handleCTAClick = useCallback( () => {
		setIsNavigating( true );

		// Handle internal tracking.
		trackEvent(
			`${ viewContext }_kmw-settings-change-from-manual-to-tailored`,
			'confirm_get_tailored_metrics',
			'conversion_reporting'
		);
	}, [ setIsNavigating, viewContext ] );

	return (
		<Grid>
			<Row>
				<Cell alignMiddle size={ 12 }>
					<Notice
						type="new"
						className="googlesitekit-acr-subtle-notification"
						title={ __(
							'Personalize your metrics',
							'google-site-kit'
						) }
						description={ __(
							'Set up your goals by answering 3 quick questions to help us show the most relevant data for your site',
							'google-site-kit'
						) }
						ctaButton={ {
							label: __(
								'Get tailored metrics',
								'google-site-kit'
							),
							onClick: handleCTAClick,
							inProgress: isNavigating,
							disabled: isNavigating,
							href: userInputURL,
						} }
					/>
				</Cell>
			</Row>
		</Grid>
	);
}
