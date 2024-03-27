/**
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
import classNames from 'classnames';
import { useIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { Grid, Cell, Row } from '../../material-components';
import Badge from '../../components/Badge';
import ConsentModeSwitch from '../consent-mode/ConsentModeSwitch';
import WPConsentAPIRequirements from '../consent-mode/WPConsentAPIRequirements';
import Layout from '../layout/Layout';
import SettingsNotice, { TYPE_INFO } from '../SettingsNotice';
import { DAY_IN_SECONDS, trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';

const { useDispatch, useSelect } = Data;

export default function SettingsCardConsentMode() {
	const viewContext = useViewContext();

	const isAdsConnected = useSelect( ( select ) => {
		// TODO: Replace the `getAdsConversionID()` selector with its `ads`
		// version once it's implemented.

		const { getAdsConversionID, getAdsLinked } =
			select( MODULES_ANALYTICS_4 );

		return getAdsConversionID() || getAdsLinked();
	} );

	const isConsentModeEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isConsentModeEnabled()
	);

	const consentAPIInfo = useSelect( ( select ) =>
		select( CORE_SITE ).getConsentAPIInfo()
	);

	const isLoading = useSelect( ( select ) => {
		const { isResolving, hasFinishedResolution } = select( CORE_SITE );

		return (
			! hasFinishedResolution( 'getConsentModeSettings' ) ||
			! hasFinishedResolution( 'getConsentAPIInfo' ) ||
			isResolving( 'getConsentModeSettings' ) ||
			isResolving( 'getConsentAPIInfo' )
		);
	} );

	const trackingRef = useRef();
	const intersectionEntry = useIntersection( trackingRef, {
		threshold: 0.25,
	} );
	const [ hasBeenInView, setHasBeenInView ] = useState( false );
	const inView = !! intersectionEntry?.intersectionRatio;

	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);
	const { triggerSurvey } = useDispatch( CORE_USER );

	useEffect( () => {
		if ( inView && ! hasBeenInView ) {
			// Track an event when the user sees the Consent Mode settings.
			trackEvent( `${ viewContext }_CoMo`, 'view_requirements' );

			if (
				isAdsConnected &&
				isConsentModeEnabled === false &&
				usingProxy
			) {
				triggerSurvey( 'view_como_setup_cta', { ttl: DAY_IN_SECONDS } );
			}

			setHasBeenInView( true );
		}
	}, [
		inView,
		hasBeenInView,
		viewContext,
		usingProxy,
		triggerSurvey,
		isAdsConnected,
		isConsentModeEnabled,
	] );

	return (
		<Layout
			title={ __( 'Consent Mode', 'google-site-kit' ) }
			badge={
				isAdsConnected ? (
					<Badge
						className="googlesitekit-badge--primary"
						label={ __( 'Recommended', 'google-site-kit' ) }
					/>
				) : null
			}
			header
			rounded
		>
			<div
				className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-consent-mode"
				ref={ trackingRef }
			>
				<Grid>
					<Row>
						<Cell
							size={ 12 }
							className={ classNames( {
								'googlesitekit-overflow-hidden': isLoading,
							} ) }
						>
							<ConsentModeSwitch loading={ isLoading } />
						</Cell>
					</Row>
					{ ! isLoading && (
						<Fragment>
							{ isAdsConnected && ! isConsentModeEnabled && (
								<Row>
									<Cell size={ 12 }>
										<SettingsNotice
											className="googlesitekit-settings-consent-mode__recommendation-notice"
											type={ TYPE_INFO }
											notice={ __(
												'If you have Google Ads campaigns for this site, it’s highly recommended to enable Consent mode - otherwise, you won’t be able to collect any metrics on the effectiveness of your campaigns in regions like the European Economic Area.',
												'google-site-kit'
											) }
										/>
									</Cell>
								</Row>
							) }
							{ !! consentAPIInfo && isConsentModeEnabled && (
								<Row>
									<Cell size={ 12 }>
										<WPConsentAPIRequirements />
									</Cell>
								</Row>
							) }
						</Fragment>
					) }
				</Grid>
			</div>
		</Layout>
	);
}
