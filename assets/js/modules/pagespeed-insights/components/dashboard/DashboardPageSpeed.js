/**
 * Dashboard PageSpeed Widget component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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

/* eslint complexity: [ "error", 20 ] */

/**
 * External dependencies
 */
import classnames from 'classnames';
import { useIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { Button, ProgressBar, Tab, TabBar } from 'googlesitekit-components';
import { useSelect, useDispatch, useInViewSelect } from 'googlesitekit-data';
import DeviceSizeTabBar from '../../../../components/DeviceSizeTabBar';
import Link from '../../../../components/Link';
import LabReportMetrics from '../common/LabReportMetrics';
import FieldReportMetrics from '../common/FieldReportMetrics';
import Recommendations from '../common/Recommendations';
import ReportDetailsLink from '../common/ReportDetailsLink';
import { trackEvent } from '../../../../util/tracking';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';
import {
	MODULES_PAGESPEED_INSIGHTS,
	STRATEGY_MOBILE,
	STRATEGY_DESKTOP,
	DATA_SRC_FIELD,
	DATA_SRC_LAB,
	DATA_SRC_RECOMMENDATIONS,
	UI_STRATEGY,
	UI_DATA_SOURCE,
} from '../../datastore/constants';
import Spinner from '../../../../components/Spinner';
import useViewContext from '../../../../hooks/useViewContext';
import DashboardPageSpeedLoading from './DashboardPageSpeedLoading';

const TAB_INDEX_LAB = 0;
const TAB_INDEX_FIELD = 1;
const TAB_INDEX_RECOMMENDATIONS = 2;

export default function DashboardPageSpeed() {
	const trackingRef = useRef();

	const [ hasBeenInView, setHasBeenInView ] = useState( false );

	const viewContext = useViewContext();
	const referenceURL = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentReferenceURL()
	);
	const strategy =
		useSelect( ( select ) => select( CORE_UI ).getValue( UI_STRATEGY ) ) ||
		STRATEGY_MOBILE;
	const dataSrc =
		useSelect( ( select ) =>
			select( CORE_UI ).getValue( UI_DATA_SOURCE )
		) || DATA_SRC_LAB;

	const { isFetchingMobile, isFetchingDesktop, errorMobile, errorDesktop } =
		useSelect( ( select ) => {
			const store = select( MODULES_PAGESPEED_INSIGHTS );

			return {
				isFetchingMobile: ! store.hasFinishedResolution( 'getReport', [
					referenceURL,
					STRATEGY_MOBILE,
				] ),
				errorMobile: store.getErrorForSelector( 'getReport', [
					referenceURL,
					STRATEGY_MOBILE,
				] ),
				isFetchingDesktop: ! store.hasFinishedResolution( 'getReport', [
					referenceURL,
					STRATEGY_DESKTOP,
				] ),
				errorDesktop: store.getErrorForSelector( 'getReport', [
					referenceURL,
					STRATEGY_DESKTOP,
				] ),
			};
		} );

	const reportMobile = useInViewSelect(
		( select ) =>
			select( MODULES_PAGESPEED_INSIGHTS ).getReport(
				referenceURL,
				STRATEGY_MOBILE
			),
		[ referenceURL ]
	);

	const reportDesktop = useInViewSelect(
		( select ) =>
			select( MODULES_PAGESPEED_INSIGHTS ).getReport(
				referenceURL,
				STRATEGY_DESKTOP
			),
		[ referenceURL ]
	);

	const { setValues } = useDispatch( CORE_UI );
	const { invalidateResolution } = useDispatch( MODULES_PAGESPEED_INSIGHTS );

	const intersectionEntry = useIntersection( trackingRef, {
		threshold: 0.25,
	} );
	const inView = !! intersectionEntry?.intersectionRatio;

	const isFetching =
		strategy === STRATEGY_MOBILE ? isFetchingMobile : isFetchingDesktop;

	useEffect( () => {
		if ( inView && ! hasBeenInView ) {
			trackEvent( `${ viewContext }_pagespeed-widget`, 'widget_view' );
			trackEvent(
				`${ viewContext }_pagespeed-widget`,
				'default_tab_view',
				dataSrc.replace( 'data_', '' )
			);
			setHasBeenInView( true );
		}
	}, [ inView, dataSrc, viewContext, hasBeenInView ] );

	// Update the active tab for "In the Lab" or "In The Field".
	const updateActiveTab = useCallback(
		( dataSrcIndex ) => {
			let eventLabel;

			switch ( dataSrcIndex ) {
				case TAB_INDEX_LAB:
					setValues( { [ UI_DATA_SOURCE ]: DATA_SRC_LAB } );
					eventLabel = 'lab';
					break;
				case TAB_INDEX_FIELD:
					setValues( { [ UI_DATA_SOURCE ]: DATA_SRC_FIELD } );
					eventLabel = 'field';
					break;
				case TAB_INDEX_RECOMMENDATIONS:
					setValues( {
						[ UI_DATA_SOURCE ]: DATA_SRC_RECOMMENDATIONS,
					} );
					eventLabel = 'recommendations';
					break;
				default:
					break;
			}

			trackEvent(
				`${ viewContext }_pagespeed-widget`,
				'tab_select',
				eventLabel
			);
		},
		[ setValues, viewContext ]
	);

	// Update the active tab for "mobile" or "desktop".
	const updateActiveDeviceSize = useCallback(
		( { slug } ) => {
			if ( slug === STRATEGY_DESKTOP ) {
				setValues( { [ UI_STRATEGY ]: STRATEGY_DESKTOP } );
			} else {
				setValues( { [ UI_STRATEGY ]: STRATEGY_MOBILE } );
			}
		},
		[ setValues ]
	);

	const updateReport = useCallback(
		async ( event ) => {
			event.preventDefault();

			// Invalidate the PageSpeed API request caches.
			await API.invalidateCache(
				'modules',
				'pagespeed-insights',
				'pagespeed'
			);

			// Invalidate the cached resolver.
			invalidateResolution( 'getReport', [
				referenceURL,
				STRATEGY_DESKTOP,
			] );
			invalidateResolution( 'getReport', [
				referenceURL,
				STRATEGY_MOBILE,
			] );
		},
		[ invalidateResolution, referenceURL ]
	);

	const reportData =
		strategy === STRATEGY_MOBILE ? reportMobile : reportDesktop;
	const reportError =
		strategy === STRATEGY_MOBILE ? errorMobile : errorDesktop;

	const finishedResolution = useSelect( ( select ) =>
		select( MODULES_PAGESPEED_INSIGHTS ).hasFinishedResolution(
			'getReport',
			[ referenceURL, strategy ]
		)
	);
	const recommendations = useInViewSelect(
		( select ) => {
			if ( reportError ) {
				return [];
			}

			const allAudits = select(
				MODULES_PAGESPEED_INSIGHTS
			).getAuditsWithStackPack( referenceURL, strategy, 'wordpress' );

			if ( ! allAudits || ! Object.keys( allAudits ).length ) {
				return [];
			}

			return Object.values( allAudits )
				.filter(
					( { scoreDisplayMode, score } ) =>
						scoreDisplayMode === 'metricSavings' && score < 1
				)
				.sort( ( a, b ) => {
					// If the scores are the same, sort alphabetically by
					// audit slug. This is how the API returns audits.
					if ( a.score === b.score ) {
						return a.id < b.id ? -1 : 1;
					}

					return a.score - b.score;
				} )
				.map( ( { id, title } ) => ( {
					id,
					title,
				} ) );
		},
		[ referenceURL, strategy, finishedResolution ]
	);

	// Set the default data source based on report data.
	useEffect( () => {
		if (
			reportMobile?.loadingExperience?.metrics &&
			reportDesktop?.loadingExperience?.metrics
		) {
			setValues( { [ UI_DATA_SOURCE ]: DATA_SRC_FIELD } );
		}
	}, [ reportMobile, reportDesktop, setValues ] );

	const isLoading =
		! referenceURL || ( isFetching && ! reportData ) || ! dataSrc;

	const isFieldTabWithData =
		dataSrc === DATA_SRC_FIELD &&
		[
			'LARGEST_CONTENTFUL_PAINT_MS',
			'CUMULATIVE_LAYOUT_SHIFT_SCORE',
			'FIRST_INPUT_DELAY_MS',
		].every( ( key ) => reportData?.loadingExperience?.metrics?.[ key ] );

	if ( isLoading ) {
		return (
			<div
				id="googlesitekit-pagespeed-header"
				className="googlesitekit-pagespeed-widget__content-wrapper googlesitekit-pagespeed-widget__content-wrapper--loading"
			>
				<DashboardPageSpeedLoading />
			</div>
		);
	}

	return (
		<div
			id="googlesitekit-pagespeed-header" // Used by jump link.
			className="googlesitekit-pagespeed-widget__content-wrapper"
		>
			<div className="googlesitekit-pagespeed-widget__content">
				<header
					className="googlesitekit-pagespeed-widget__header"
					ref={ trackingRef }
				>
					<div className="googlesitekit-pagespeed-widget__data-src-tabs">
						<TabBar
							activeIndex={ [
								DATA_SRC_LAB,
								DATA_SRC_FIELD,
								DATA_SRC_RECOMMENDATIONS,
							].indexOf( dataSrc ) }
							handleActiveIndexUpdate={ updateActiveTab }
						>
							<Tab
								focusOnActivate={ false }
								aria-labelledby={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_LAB }` }
								disabled={ isFetching }
							>
								<span
									id={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_LAB }` }
									className="mdc-tab__text-label"
								>
									{ __( 'In the Lab', 'google-site-kit' ) }
								</span>
							</Tab>
							<Tab
								focusOnActivate={ false }
								aria-labelledby={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_FIELD }` }
								disabled={ isFetching }
							>
								<span
									id={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_FIELD }` }
									className="mdc-tab__text-label"
								>
									{ __( 'In the Field', 'google-site-kit' ) }
								</span>
							</Tab>
							<Tab
								focusOnActivate={ false }
								aria-labelledby={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_RECOMMENDATIONS }` }
								disabled={ isFetching }
							>
								<span
									id={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_RECOMMENDATIONS }` }
									className="mdc-tab__text-label"
								>
									{ __(
										'How to improve',
										'google-site-kit'
									) }
								</span>
							</Tab>
						</TabBar>
					</div>
					<div className="googlesitekit-pagespeed-widget__device-size-tab-bar-wrapper">
						<DeviceSizeTabBar
							activeTab={ strategy }
							disabled={ isFetching }
							handleDeviceSizeUpdate={ updateActiveDeviceSize }
						/>
					</div>
				</header>
				{ isFetching && ! isLoading && (
					<div className="googlesitekit-pagespeed-widget__refreshing-progress-bar-wrapper">
						<ProgressBar compress />
					</div>
				) }

				<section
					className={ classnames( {
						'googlesitekit-pagespeed-widget__refreshing':
							isFetching,
					} ) }
				>
					{ dataSrc === DATA_SRC_LAB && (
						<LabReportMetrics
							data={ reportData }
							error={ reportError }
						/>
					) }
					{ dataSrc === DATA_SRC_FIELD && (
						<FieldReportMetrics
							data={ reportData }
							error={ reportError }
						/>
					) }
					{ dataSrc === DATA_SRC_RECOMMENDATIONS && (
						<Recommendations
							className={ classnames( {
								'googlesitekit-pagespeed-widget__refreshing':
									isFetching,
							} ) }
							recommendations={ recommendations }
							referenceURL={ referenceURL }
							strategy={ strategy }
						/>
					) }
				</section>

				{ ( dataSrc === DATA_SRC_LAB || isFieldTabWithData ) && (
					<div className="googlesitekit-pagespeed-report__row">
						<Button
							className={ classnames( {
								'googlesitekit-pagespeed__recommendations-cta--hidden':
									! recommendations?.length,
							} ) }
							disabled={ isFetching }
							onClick={ () =>
								updateActiveTab( TAB_INDEX_RECOMMENDATIONS )
							}
						>
							{ __( 'How to improve', 'google-site-kit' ) }
						</Button>
					</div>
				) }

				<div
					className={ classnames(
						'googlesitekit-pagespeed-report__footer',
						{
							'googlesitekit-pagespeed-report__footer--with-action':
								dataSrc === DATA_SRC_LAB,
						}
					) }
				>
					{ dataSrc === DATA_SRC_LAB && ! isLoading && (
						<div>
							<Link
								onClick={ updateReport }
								disabled={ isFetching }
							>
								{ __( 'Run test again', 'google-site-kit' ) }
							</Link>
							<Spinner isSaving={ isFetching } />
						</div>
					) }
					<ReportDetailsLink />
				</div>
			</div>
		</div>
	);
}
