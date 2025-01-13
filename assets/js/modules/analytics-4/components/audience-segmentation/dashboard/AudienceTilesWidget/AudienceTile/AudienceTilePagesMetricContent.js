/**
 * AudienceTilePagesMetricContent component.
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

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../../../hooks/useBreakpoint';
import { CORE_USER } from '../../../../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../../../datastore/constants';
import AudienceTileNoData from './AudienceTileNoData';
import Link from '../../../../../../../components/Link';
import PartialDataNotice from './PartialDataNotice';
import { numFmt, trackEvent } from '../../../../../../../util';
import withIntersectionObserver from '../../../../../../../util/withIntersectionObserver';
import useViewContext from '../../../../../../../hooks/useViewContext';
import useViewOnly from '../../../../../../../hooks/useViewOnly';
import CreateCustomDimensionCTA from './CreateCustomDimensionCTA';

const CreateCustomDimensionCTAWithIntersectionObserver =
	withIntersectionObserver( CreateCustomDimensionCTA );

export default function AudienceTilePagesMetricContent( {
	topContentTitles,
	topContent,
	isTopContentPartialData,
	hasCustomDimension,
	onCreateCustomDimension,
	isSaving,
} ) {
	const viewContext = useViewContext();
	const viewOnlyDashboard = useViewOnly();
	const breakpoint = useBreakpoint();

	const isMobileBreakpoint = [ BREAKPOINT_SMALL, BREAKPOINT_TABLET ].includes(
		breakpoint
	);

	const validDimensionValues =
		topContent?.dimensionValues?.filter( Boolean ) || [];
	const hasDimensionValues = !! validDimensionValues.length;

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	function handleCreateCustomDimension() {
		trackEvent(
			`${ viewContext }_audiences-top-content-cta`,
			'create_custom_dimension'
		).finally( onCreateCustomDimension );
	}

	function ContentLinkComponent( { content } ) {
		const pageTitle = topContentTitles[ content?.value ];
		const url = content?.value;

		const serviceURL = useSelect( ( select ) => {
			return ! viewOnlyDashboard
				? select( MODULES_ANALYTICS_4 ).getServiceReportURL(
						'all-pages-and-screens',
						{
							filters: {
								unifiedPagePathScreen: url,
							},
							dates,
						}
				  )
				: null;
		} );

		if ( viewOnlyDashboard ) {
			return (
				<div className="googlesitekit-audience-segmentation-tile__top-content-metric-name">
					{ pageTitle }
				</div>
			);
		}
		return (
			<Link
				href={ serviceURL }
				title={ pageTitle }
				external
				hideExternalIndicator
			>
				{ pageTitle }
			</Link>
		);
	}

	return (
		<div className="googlesitekit-audience-segmentation-tile-metric__content">
			{ ! hasCustomDimension && (
				<CreateCustomDimensionCTAWithIntersectionObserver
					onClick={ handleCreateCustomDimension }
					isSaving={ isSaving }
					onInView={ () => {
						trackEvent(
							`${ viewContext }_audiences-top-content-cta`,
							'view_cta'
						);
					} }
				/>
			) }
			{ hasCustomDimension && ! hasDimensionValues && (
				<AudienceTileNoData />
			) }
			{ hasCustomDimension &&
				hasDimensionValues &&
				validDimensionValues.map( ( content, index ) => {
					return (
						<div
							key={ content?.value }
							className="googlesitekit-audience-segmentation-tile-metric__page-metric-container"
						>
							<ContentLinkComponent content={ content } />
							<div className="googlesitekit-audience-segmentation-tile-metric__page-metric-value">
								{ numFmt(
									topContent?.metricValues[ index ]?.value
								) }
							</div>
						</div>
					);
				} ) }
			{ isMobileBreakpoint && isTopContentPartialData && (
				<PartialDataNotice
					content={ __(
						'Still collecting full data for this timeframe, partial data is displayed for this metric',
						'google-site-kit'
					) }
				/>
			) }
		</div>
	);
}

AudienceTilePagesMetricContent.propTypes = {
	topContentTitles: PropTypes.object,
	topContent: PropTypes.object,
	isTopContentPartialData: PropTypes.bool,
	hasCustomDimension: PropTypes.bool,
	onCreateCustomDimension: PropTypes.func,
	isSaving: PropTypes.bool,
};
