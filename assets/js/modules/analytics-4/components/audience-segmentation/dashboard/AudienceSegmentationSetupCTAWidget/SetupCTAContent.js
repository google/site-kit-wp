/**
 * AudienceSegmentationSetupCTAWidget component.
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
import { __ } from '@wordpress/i18n';
import { Fragment, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BannerGraphicsSVGDesktop from '../../../../../../../svg/graphics/audience-segmentation-setup-desktop.svg';
import BannerGraphicsSVGTablet from '../../../../../../../svg/graphics/audience-segmentation-setup-tablet.svg';
import BannerGraphicsSVGMobile from '../../../../../../../svg/graphics/audience-segmentation-setup-mobile.svg';
import { Button, SpinnerButton } from 'googlesitekit-components';
import { Cell, Grid, Row } from '../../../../../../material-components';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../../hooks/useBreakpoint';

const SetupCTAContent = forwardRef(
	(
		{ Widget, onEnableGroups, isSaving, dismissCount, handleDismissClick },
		ref
	) => {
		const breakpoint = useBreakpoint();
		const isMobileBreakpoint = breakpoint === BREAKPOINT_SMALL;
		const isTabletBreakpoint = breakpoint === BREAKPOINT_TABLET;

		// TODO: We need to refactor this and the ConsentModeSetupCTAWidget to avoid this duplicate inlining of the widget context and area structure,
		// and to ensure only one of these setup CTAs is shown at a time. This will be handled in a subsequent issue.
		return (
			<div ref={ ref } className="googlesitekit-widget-context">
				<Grid className="googlesitekit-widget-area">
					<Row>
						<Cell size={ 12 }>
							<Widget
								noPadding
								className="googlesitekit-audience-segmentation-setup-cta-widget"
							>
								<Grid collapsed>
									<Row>
										<Cell
											smSize={ 6 }
											mdSize={ 8 }
											lgSize={ 7 }
											className="googlesitekit-widget-audience-segmentation-primary-cell"
										>
											<div className="googlesitekit-widget-audience-segmentation-text__wrapper">
												<h3 className="googlesitekit-publisher-win__title">
													{ __(
														'Learn how different types of visitors interact with your site',
														'google-site-kit'
													) }
												</h3>
												<p>
													{ __(
														'Understand what brings new visitors to your site and keeps them coming back. Site Kit can now group your site visitors into relevant segments like "new" and "returning". To set up these new groups, Site Kit needs to update your Google Analytics property.',
														'google-site-kit'
													) }
												</p>
											</div>
											<div className="googlesitekit-widget-audience-segmentation-actions__wrapper">
												<Fragment>
													<SpinnerButton
														className="googlesitekit-audience-segmentation-cta-button"
														onClick={
															onEnableGroups
														}
														isSaving={ isSaving }
													>
														{ isSaving
															? __(
																	'Enabling groups',
																	'google-site-kit'
															  )
															: __(
																	'Enable groups',
																	'google-site-kit'
															  ) }
													</SpinnerButton>
													<Button
														tertiary
														onClick={
															handleDismissClick
														}
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
												</Fragment>
											</div>
										</Cell>
										{ ! isMobileBreakpoint &&
											! isTabletBreakpoint && (
												<Cell
													alignBottom
													className="googlesitekit-widget-audience-segmentation-svg__wrapper"
													smSize={ 6 }
													mdSize={ 3 }
													lgSize={ 5 }
												>
													<BannerGraphicsSVGDesktop />
												</Cell>
											) }
										{ isTabletBreakpoint && (
											<Cell
												className="googlesitekit-widget-audience-segmentation-svg__wrapper"
												mdSize={ 8 }
											>
												<BannerGraphicsSVGTablet />
											</Cell>
										) }
										{ isMobileBreakpoint && (
											<Cell
												className="googlesitekit-widget-audience-segmentation-svg__wrapper"
												smSize={ 8 }
											>
												<BannerGraphicsSVGMobile />
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
);

SetupCTAContent.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	onEnableGroups: PropTypes.func.isRequired,
	isSaving: PropTypes.bool.isRequired,
	dismissCount: PropTypes.number.isRequired,
	handleDismissClick: PropTypes.func.isRequired,
};

export default SetupCTAContent;
