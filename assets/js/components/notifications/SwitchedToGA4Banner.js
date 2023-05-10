/**
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import GA4SuccessGreenSVG from '../../../svg/graphics/ga4-success-green.svg';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { MODULES_ANALYTICS } from '../../modules/analytics/datastore/constants';
import { UA_CUTOFF_DATE } from '../../modules/analytics/constants';
import { stringToDate } from '../../util';
import { isValidPropertyID } from '../../modules/analytics/util';
import ga4Reporting from '../../feature-tours/ga4-reporting';
import BannerNotification from './BannerNotification';
const { useSelect, useDispatch } = Data;

export default function SwitchedToGA4Banner() {
	const isGA4DashboardView = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGA4DashboardView()
	);

	const referenceDate = useSelect( ( select ) =>
		select( CORE_USER ).getReferenceDate()
	);

	const isTourDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isTourDismissed( ga4Reporting.slug )
	);

	const showGA4ReportingTour = useSelect( ( select ) => {
		return select( CORE_UI ).getValue( 'showGA4ReportingTour' );
	} );

	const isUAConnected = useSelect( ( select ) => {
		const propertyID = select( MODULES_ANALYTICS ).getPropertyID();

		return isValidPropertyID( propertyID );
	} );

	const { setValue } = useDispatch( CORE_UI );
	const handleCTAClick = () => {
		setValue( 'showGA4ReportingTour', true );
	};

	const { dismissTour } = useDispatch( CORE_USER );
	const handleDismissClick = () => {
		dismissTour( ga4Reporting.slug );
	};

	if (
		! isUAConnected ||
		! isGA4DashboardView ||
		isTourDismissed === undefined ||
		isTourDismissed ||
		showGA4ReportingTour
	) {
		return null;
	}

	const description =
		stringToDate( referenceDate ) >= stringToDate( UA_CUTOFF_DATE )
			? __(
					'Universal Analytics, the old version of Google Analytics, stopped collecting data on July 1, 2023.',
					'google-site-kit'
			  )
			: __(
					'Universal Analytics, the old version of Google Analytics, will stop collecting data on July 1, 2023.',
					'google-site-kit'
			  );

	return (
		<BannerNotification
			id="switched-ga4-dashboard-view"
			title={ __(
				'Your dashboard now displays data from Google Analytics 4, the new version of Analytics',
				'google-site-kit'
			) }
			description={ description }
			ctaLabel={ __( 'Learn what’s new', 'google-site-kit' ) }
			ctaLink="#"
			onCTAClick={ handleCTAClick }
			onDismiss={ handleDismissClick }
			dismiss={ __( 'OK, Got it!', 'google-site-kit' ) }
			WinImageSVG={ () => <GA4SuccessGreenSVG /> }
		/>
	);
}
