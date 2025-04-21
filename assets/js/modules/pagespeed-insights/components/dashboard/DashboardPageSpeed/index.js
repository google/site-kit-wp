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
import { Button, ProgressBar } from 'googlesitekit-components';
import { useSelect, useDispatch, useInViewSelect } from 'googlesitekit-data';
import { trackEvent } from '../../../../../util/tracking';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import {
	MODULES_PAGESPEED_INSIGHTS,
	STRATEGY_MOBILE,
	STRATEGY_DESKTOP,
	DATA_SRC_FIELD,
	DATA_SRC_LAB,
	DATA_SRC_RECOMMENDATIONS,
	UI_STRATEGY,
	UI_DATA_SOURCE,
} from '../../../datastore/constants';
import useViewContext from '../../../../../hooks/useViewContext';
import Loading from './Loading';
import Header from './Header';
import Footer from './Footer';
import Content from './Content';

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
				<Loading />
			</div>
		);
	}

	return (
		<div
			id="googlesitekit-pagespeed-header" // Used by jump link.
			className="googlesitekit-pagespeed-widget__content-wrapper"
		>
			<div className="googlesitekit-pagespeed-widget__content">
				<Header
					ref={ trackingRef }
					isFetching={ isFetching }
					updateActiveTab={ updateActiveTab }
				/>

				{ isFetching && (
					<div className="googlesitekit-pagespeed-widget__refreshing-progress-bar-wrapper">
						<ProgressBar compress />
					</div>
				) }

				<Content
					isFetching={ isFetching }
					recommendations={ recommendations }
					reportData={ reportData }
					reportError={ reportError }
				/>

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

				<Footer isFetching={ isFetching } />
			</div>
		</div>
	);
}
