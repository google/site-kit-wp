/**
 * Reader Revenue Manager Setup CTA Banner component.
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
import {
	createInterpolateElement,
	Fragment,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../hooks/useBreakpoint';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';
import whenInactive from '../../../../util/when-inactive';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	READER_REVENUE_MANAGER_MODULE_SLUG,
	READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY,
} from '../../datastore/constants';
import { Cell, Grid, Row } from '../../../../material-components';
import SetupSVG from '../../../../../svg/graphics/reader-revenue-manager-setup.svg';
import SetupTabletSVG from '../../../../../svg/graphics/reader-revenue-manager-setup-tablet.svg';
import SetupMobileSVG from '../../../../../svg/graphics/reader-revenue-manager-setup-mobile.svg';
import Link from '../../../../components/Link';
import { trackEvent, WEEK_IN_SECONDS } from '../../../../util';
import {
	AdminMenuTooltip,
	useShowTooltip,
	useTooltipState,
} from '../../../../components/AdminMenuTooltip';
import useViewContext from '../../../../hooks/useViewContext';

function ReaderRevenueManagerSetupCTABanner( { Widget, WidgetNull } ) {
	const viewContext = useViewContext();
	const breakpoint = useBreakpoint();
	const isMobileBreakpoint = breakpoint === BREAKPOINT_SMALL;
	const isTabletBreakpoint = breakpoint === BREAKPOINT_TABLET;

	const onSetupActivate = useActivateModuleCallback(
		READER_REVENUE_MANAGER_MODULE_SLUG
	);

	const onSetupCallback = useCallback( () => {
		trackEvent(
			`${ viewContext }_rrm-setup-notification`,
			'confirm_notification'
		).finally( () => {
			onSetupActivate();
		} );
	}, [ onSetupActivate, viewContext ] );

	const showTooltip = useShowTooltip(
		READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY
	);
	const { isTooltipVisible } = useTooltipState(
		READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isPromptDismissed(
			READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY
		)
	);

	const dismissCount = useSelect( ( select ) =>
		select( CORE_USER ).getPromptDismissCount(
			READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY
		)
	);

	const dismissedPromptsLoaded = useSelect( ( select ) =>
		select( CORE_USER ).hasFinishedResolution( 'getDismissedPrompts', [] )
	);

	const { dismissPrompt } = useDispatch( CORE_USER );

	const onDismiss = useCallback( () => {
		trackEvent(
			`${ viewContext }_rrm-setup-notification`,
			'dismiss_notification'
		).finally( () => {
			const expirationInSeconds =
				dismissCount < 1 ? 2 * WEEK_IN_SECONDS : 0;

			showTooltip();

			dismissPrompt( READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY, {
				expiresInSeconds: expirationInSeconds,
			} );
		} );
	}, [ dismissCount, dismissPrompt, showTooltip, viewContext ] );

	const readerRevenueManagerDocumentationURL =
		'https://readerrevenue.withgoogle.com';

	const canActivateRRMModule = useSelect( ( select ) =>
		select( CORE_MODULES ).canActivateModule(
			READER_REVENUE_MANAGER_MODULE_SLUG
		)
	);

	const showBanner =
		isDismissed === false &&
		canActivateRRMModule &&
		dismissedPromptsLoaded === true;

	useEffect( () => {
		if ( showBanner ) {
			trackEvent(
				`${ viewContext }_rrm-setup-notification`,
				'view_notification'
			);
		}
	}, [ showBanner, viewContext ] );

	if ( isTooltipVisible ) {
		return (
			<Fragment>
				<WidgetNull />
				<AdminMenuTooltip
					title=""
					content={ __(
						'You can always enable Reader Revenue Manager from Settings later',
						'google-site-kit'
					) }
					dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					tooltipStateKey={
						READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY
					}
				/>
			</Fragment>
		);
	}

	if ( ! showBanner ) {
		return <WidgetNull />;
	}

	return (
		<div className="googlesitekit-widget-context">
			<Grid className="googlesitekit-widget-area">
				<Row>
					<Cell size={ 12 }>
						<Widget
							noPadding
							className="googlesitekit-setup-cta-banner googlesitekit-reader-revenue-manager-setup-cta-widget"
						>
							<Grid collapsed>
								<Row>
									<Cell
										smSize={ 12 }
										mdSize={ 8 }
										lgSize={ 6 }
										className="googlesitekit-setup-cta-banner__primary-cell"
									>
										<h4 className="googlesitekit-setup-cta-banner__title">
											{ __(
												'Grow your revenue and deepen reader engagement',
												'google-site-kit'
											) }
										</h4>
										<p className="googlesitekit-setup-cta-banner__description">
											{ createInterpolateElement(
												__(
													'Turn casual visitors into loyal readers and earn more from your content with voluntary contributions, surveys, newsletter sign-ups and reader insight tools. <a>Learn more</a>',
													'google-site-kit'
												),
												{
													a: (
														<Link
															href={
																readerRevenueManagerDocumentationURL
															}
															external
															aria-label={ __(
																'Learn more about reader revenue manager',
																'google-site-kit'
															) }
														/>
													),
												}
											) }
											<br />
											<br />
											{ __(
												'* Support for subscriptions coming soon',
												'google-site-kit'
											) }
										</p>

										<div className="googlesitekit-setup-cta-banner__actions-wrapper">
											<Button
												className="googlesitekit-key-metrics-cta-button"
												onClick={ onSetupCallback }
											>
												{ __(
													'Set up Reader Revenue Manager',
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
												<SetupSVG />
											</Cell>
										) }
									{ isTabletBreakpoint && (
										<Cell
											className="googlesitekit-setup-cta-banner__svg-wrapper"
											mdSize={ 8 }
										>
											<SetupTabletSVG />
										</Cell>
									) }
									{ isMobileBreakpoint && (
										<Cell
											alignBottom
											className="googlesitekit-setup-cta-banner__svg-wrapper"
											smSize={ 12 }
										>
											<SetupMobileSVG />
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

ReaderRevenueManagerSetupCTABanner.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};

export default compose(
	whenInactive( {
		moduleName: READER_REVENUE_MANAGER_MODULE_SLUG,
	} ),
	withWidgetComponentProps( 'readerRevenueManagerSetupCTABanner' )
)( ReaderRevenueManagerSetupCTABanner );
