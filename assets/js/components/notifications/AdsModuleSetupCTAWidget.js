/**
 * AdsModuleSetupCTAWidget component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../hooks/useBreakpoint';
import { ADS_MODULE_SETUP_BANNER_PROMPT_DISMISSED_KEY } from '../../modules/ads/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { WEEK_IN_SECONDS } from '../../util';
import { Cell, Grid, Row } from '../../material-components';
import whenInactive from '../../util/when-inactive';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';
import useActivateModuleCallback from '../../hooks/useActivateModuleCallback';
import AdsSetupSVG from '../../../svg/graphics/ads-setup.svg';
import AdsSetupTabletSVG from '../../../svg/graphics/ads-setup-tablet.svg';
import AdsSetupMobileSVG from '../../../svg/graphics/ads-setup-mobile.svg';

const { useSelect, useDispatch } = Data;

function AdsModuleSetupCTAWidget( { WidgetNull, Widget } ) {
	const breakpoint = useBreakpoint();
	const isMobileBreakpoint = breakpoint === BREAKPOINT_SMALL;
	const isTabletBreakpoint = breakpoint === BREAKPOINT_TABLET;

	const onSetupCallback = useActivateModuleCallback( 'ads' );

	const dismissCount = useSelect( ( select ) =>
		select( CORE_USER ).getPromptDismissCount(
			ADS_MODULE_SETUP_BANNER_PROMPT_DISMISSED_KEY
		)
	);

	const { dismissPrompt } = useDispatch( CORE_USER );

	const onDismiss = useCallback( async () => {
		if ( dismissCount < 1 ) {
			const twoWeeksInSeconds = WEEK_IN_SECONDS * 2;

			await dismissPrompt( ADS_MODULE_SETUP_BANNER_PROMPT_DISMISSED_KEY, {
				expiresInSeconds: twoWeeksInSeconds,
			} );
		} else {
			// For the second dismissal, dismiss permanently.
			await dismissPrompt( ADS_MODULE_SETUP_BANNER_PROMPT_DISMISSED_KEY );
		}
	}, [ dismissCount, dismissPrompt ] );

	if ( dismissCount > 1 ) {
		return <WidgetNull />;
	}

	return (
		<div className="googlesitekit-widget-context">
			<Grid className="googlesitekit-widget-area">
				<Row>
					<Cell size={ 12 }>
						<Widget
							noPadding
							className="googlesitekit-setup-cta-banner googlesitekit-ads-setup-cta-widget"
						>
							<Grid collapsed>
								<Row>
									<Cell
										smSize={ 12 }
										mdSize={ 8 }
										lgSize={ 6 }
										className="googlesitekit-setup-cta-banner__primary-cell"
									>
										<h3 className="googlesitekit-setup-cta-banner__title">
											{ __(
												'Get better quality leads and enhance conversions with Ads',
												'google-site-kit'
											) }
										</h3>
										<p className="googlesitekit-setup-cta-banner__description">
											{ __(
												'Help drive sales, leads, or site traffic by getting your business in front of people who are actively searching Google for products or services you offer.',
												'google-site-kit'
											) }
										</p>

										<div className="googlesitekit-setup-cta-banner__actions-wrapper">
											<Button
												className="googlesitekit-key-metrics-cta-button"
												onClick={ onSetupCallback }
											>
												{ __(
													'Set up Ads',
													'google-site-kit'
												) }
											</Button>
											<Button
												tertiary
												onClick={ onDismiss }
											>
												{ dismissCount < 1
													? __(
															'Maybe later',
															'google-site-kit'
													  )
													: __(
															'Don’t show again',
															'google-site-kit'
													  ) }
											</Button>
										</div>
									</Cell>
									{ ! isMobileBreakpoint &&
										! isTabletBreakpoint && (
											<Cell
												alignBottom
												className="googlesitekit-setup-cta-banner__svg-wrapper"
												mdSize={ 8 }
												lgSize={ 6 }
											>
												<AdsSetupSVG />
											</Cell>
										) }
									{ isTabletBreakpoint && (
										<Cell
											className="googlesitekit-setup-cta-banner__svg-wrapper"
											mdSize={ 8 }
										>
											<AdsSetupTabletSVG />
										</Cell>
									) }
									{ isMobileBreakpoint && (
										<Cell
											alignBottom
											className="googlesitekit-setup-cta-banner__svg-wrapper"
											smSize={ 12 }
										>
											<AdsSetupMobileSVG />
										</Cell>
									) }
								</Row>
							</Grid>
						</Widget>
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}

AdsModuleSetupCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};

export default compose(
	whenInactive( { moduleName: 'ads' } ),
	withWidgetComponentProps( 'ads-setup-cta' )
)( AdsModuleSetupCTAWidget );
