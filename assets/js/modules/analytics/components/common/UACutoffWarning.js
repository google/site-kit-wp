/**
 * UACutoffWarning component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	createInterpolateElement,
	Fragment,
	useEffect,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { FORM_SETUP } from '../../datastore/constants';
import { UA_CUTOFF_DATE } from '../../constants';
import { GA4_AUTO_SWITCH_DATE } from '../../../analytics-4/constants';
import { stringToDate, trackEvent } from '../../../../util';
import { Grid, Row, Cell } from '../../../../material-components/layout';
import { Button } from 'googlesitekit-components';
import Link from '../../../../components/Link';
import SettingsNotice, {
	TYPE_WARNING,
} from '../../../../components/SettingsNotice';
import useViewContext from '../../../../hooks/useViewContext';
import { useFeature } from '../../../../hooks/useFeature';
import { snapshotAllStores } from '../../../../googlesitekit/data/create-snapshot-store';
const { useDispatch, useSelect } = Data;

export default function UACutoffWarning( { className } ) {
	const viewContext = useViewContext();

	const ga4ReportingEnabled = useFeature( 'ga4Reporting' );

	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const referenceDate = useSelect( ( select ) =>
		select( CORE_USER ).getReferenceDate()
	);

	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL( 'ga4' );
	} );

	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	const { setValues } = useDispatch( CORE_FORMS );

	const { navigateTo } = useDispatch( CORE_LOCATION );

	const shouldDisplayWarning =
		ga4ReportingEnabled &&
		isAnalyticsConnected &&
		! isGA4Connected &&
		stringToDate( referenceDate ) >= stringToDate( UA_CUTOFF_DATE );

	const eventCategory = `${ viewContext }_widget-ua-stale-warning`;

	useEffect( () => {
		if ( shouldDisplayWarning ) {
			trackEvent( eventCategory, 'view_notification' );
		}
	}, [ eventCategory, shouldDisplayWarning ] );

	if ( ! shouldDisplayWarning ) {
		return null;
	}

	const handleCTAClick = async () => {
		await trackEvent( eventCategory, 'confirm_notification' );

		setValues( FORM_SETUP, {
			// Pre-enable GA4 controls.
			enableGA4: true,
			// Enable tooltip highlighting GA4 property select.
			enableGA4PropertyTooltip: true,
		} );
		await snapshotAllStores();

		navigateTo( `${ settingsURL }#connected-services/analytics/edit` );
	};

	const warningMessage =
		stringToDate( referenceDate ) >= stringToDate( GA4_AUTO_SWITCH_DATE )
			? __(
					'No fresh data to display. Universal Analytics stopped collecting data on July 1. To resume collecting Analytics data, set up Google Analytics 4. <a>Learn more</a>',
					'google-site-kit'
			  )
			: __(
					'Your data is stale because Universal Analytics stopped collecting data on July 1, 2023. <a>Learn more</a>',
					'google-site-kit'
			  );

	return (
		<Grid className={ className }>
			<Row>
				<Cell size={ 12 }>
					<SettingsNotice
						className="googlesitekit-settings-notice-ua-cutoff-warning"
						type={ TYPE_WARNING }
						CTA={ () => (
							<Button danger onClick={ handleCTAClick }>
								{ __(
									'Set up Google Analytics 4',
									'google-site-kit'
								) }
							</Button>
						) }
						notice={
							<Fragment>
								<p className="googlesitekit-settings-notice-ua-cutoff-warning__notice">
									{ createInterpolateElement(
										warningMessage,
										{
											a: (
												<Link
													aria-label={ __(
														'Learn more about Google Analytics 4',
														'google-site-kit'
													) }
													href={ documentationURL }
													onClick={ () => {
														trackEvent(
															eventCategory,
															'click_learn_more_link'
														);
													} }
													external
												/>
											),
										}
									) }
								</p>
							</Fragment>
						}
					/>
				</Cell>
			</Row>
		</Grid>
	);
}

UACutoffWarning.propTypes = {
	className: PropTypes.string,
};
