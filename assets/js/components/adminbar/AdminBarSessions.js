/**
 * Admin Bar Sessions component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DataBlock from '../DataBlock';
import PreviewBlock from '../PreviewBlock';
import ReportError from '../ReportError';
import ReportZero from '../ReportZero';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS, DATE_RANGE_OFFSET } from '../../modules/analytics/datastore/constants';
import { calculateChange } from '../../util';
import { isZeroReport } from '../../modules/analytics/util/is-zero-report';
import { passWidgetComponentProps } from './util/pass-widget-component-props';
const { useSelect } = Data;

const WIDGET_SLUG = 'adminBarSessions';

const AdminBarSessions = ( { className, WidgetReportZero } ) => {
	const url = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );
	const dateRangeDates = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		compare: true,
		offsetDays: DATE_RANGE_OFFSET,
	} ) );
	const reportArgs = {
		...dateRangeDates,
		dimensions: 'ga:date',
		limit: 10,
		metrics: [
			{
				expression: 'ga:sessions',
				alias: 'Sessions',
			},
		],
		url,
	};

	const analyticsData = useSelect( ( select ) => select( MODULES_ANALYTICS ).getReport( reportArgs ) );
	const hasFinishedResolution = useSelect( ( select ) => select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ reportArgs ] ) );
	const error = useSelect( ( select ) => select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ reportArgs ] ) );

	const reportZero = isZeroReport( analyticsData );
	// Memoise the WidgetReportZero component to avoid render loop caused by it's conditional render in AdminBarWidgets.
	const zeroDataComponent = useMemo( () => <WidgetReportZero moduleSlug="analytics" widgetSlug={ WIDGET_SLUG } />, [ reportZero ] );
	if ( reportZero ) {
		// Return the received WidgetReportZero from props, using the Widget API.
		return zeroDataComponent;
	}

	if ( ! hasFinishedResolution ) {
		return (
			<div className={ classnames(
				'mdc-layout-grid__cell',
				className,
			) }>
				<PreviewBlock width="auto" height="59px" />
			</div>
		);
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isZeroReport( analyticsData ) ) {
		return <ReportZero moduleSlug="analytics" />;
	}

	const { totals } = analyticsData[ 0 ].data;
	const lastMonth = totals[ 0 ].values;
	const previousMonth = totals[ 1 ].values;
	const totalSessions = lastMonth[ 0 ];
	const totalSessionsChange = calculateChange( previousMonth[ 0 ], lastMonth[ 0 ] );

	return (
		<div className={ classnames(
			'mdc-layout-grid__cell',
			className,
		) }>
			<DataBlock
				className="overview-total-sessions"
				title={ __( 'Total Sessions', 'google-site-kit' ) }
				datapoint={ totalSessions }
				change={ totalSessionsChange }
				changeDataUnit="%"
			/>
		</div>
	);
};

AdminBarSessions.propTypes = {
	className: PropTypes.string,
};

AdminBarSessions.defaultProps = {
	className: 'mdc-layout-grid__cell--span-2-tablet mdc-layout-grid__cell--span-3-desktop',
};

export default passWidgetComponentProps( { widgetSlug: WIDGET_SLUG } )( AdminBarSessions );
