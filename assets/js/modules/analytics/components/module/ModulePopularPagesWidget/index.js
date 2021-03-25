/**
 * ModulePopularPagesWidget component.
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
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS } from '../../../datastore/constants';
import PreviewTable from '../../../../../components/PreviewTable';
import Header from './Header';
import Table from './Table';
import Footer from './Footer';
const { useSelect } = Data;

export default function ModulePopularPagesWidget( { Widget, WidgetReportError } ) {
	const { startDate, endDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates() );

	const args = {
		startDate,
		endDate,
		dimensions: [
			'ga:pageTitle',
			'ga:pagePath',
		],
		metrics: [
			{
				expression: 'ga:pageviews',
				alias: 'Pageviews',
			},
			{
				expression: 'ga:uniquePageviews',
				alias: 'Unique Pageviews',
			},
			{
				expression: 'ga:bounceRate',
				alias: 'Bounce rate',
			},
		],
		orderby: [
			{
				fieldName: 'ga:pageviews',
				sortOrder: 'DESCENDING',
			},
		],
		limit: 10,
	};

	const report = useSelect( ( select ) => select( MODULES_ANALYTICS ).getReport( args ) );
	const loaded = useSelect( ( select ) => select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ args ] ) );
	const error = useSelect( ( select ) => select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ args ] ) );

	if ( error ) {
		return <WidgetReportError error={ error } />;
	}

	return (
		<Widget
			Header={ Header }
			Footer={ Footer }
			noPadding
		>
			{ ! loaded && (
				<PreviewTable padding />
			) }
			{ loaded && (
				<Table report={ report } />
			) }
		</Widget>
	);
}

ModulePopularPagesWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetReportError: PropTypes.elementType.isRequired,
};
