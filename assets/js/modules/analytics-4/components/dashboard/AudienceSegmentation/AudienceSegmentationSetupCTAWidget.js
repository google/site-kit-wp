/**
 * KeyMetricsSetupCTAWidget component.
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
import { Fragment, useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import whenActive from '../../../../../util/when-active';
import { Cell, Grid, Row } from '../../../../../material-components';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';
import useViewContext from '../../../../../hooks/useViewContext';
import BannerGraphicsSVGDesktop from '../../../../../../svg/graphics/audience-segmentation-setup-desktop.svg';
import BannerGraphicsSVGTablet from '../../../../../../svg/graphics/audience-segmentation-setup-tablet.svg';
import BannerGraphicsSVGMobile from '../../../../../../svg/graphics/audience-segmentation-setup-mobile.svg';

function AudienceSegmentationSetupCTAWidget( { Widget, title, description } ) {
	const [ isSaving, setIsSaving ] = useState( false );
	const viewContext = useViewContext();
	const breakpoint = useBreakpoint();
	const isMobileBreakpoint = breakpoint === BREAKPOINT_SMALL;
	const isTabletBreakpoint = breakpoint === BREAKPOINT_TABLET;

	const onEnableGroups = useCallback( () => {
		setIsSaving( true );
	}, [ viewContext ] );

	return (
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
								{ title }
							</h3>
							<p>{ description }</p>
						</div>
						<div className="googlesitekit-widget-audience-segmentation-actions__wrapper">
							<Fragment>
								<SpinnerButton
									className="googlesitekit-audience-segmentation-cta-button"
									onClick={ onEnableGroups }
									isSaving={ isSaving }
								>
									{ __( 'Enable groups', 'google-site-kit' ) }
								</SpinnerButton>
								<Button
									tertiary
									onClick={ () => {
										return false; // @todo update when logic ready.
									} }
								>
									{ __( 'Maybe later', 'google-site-kit' ) }
								</Button>
							</Fragment>
						</div>
					</Cell>
					{ ! isMobileBreakpoint && ! isTabletBreakpoint && (
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
	);
}

AudienceSegmentationSetupCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType,
};

export default whenActive( { moduleName: 'analytics-4' } )(
	AudienceSegmentationSetupCTAWidget
);
