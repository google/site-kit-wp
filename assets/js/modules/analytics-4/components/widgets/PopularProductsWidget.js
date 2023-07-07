/**
 * PopularProductsWidget component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
const { useSelect, useInViewSelect } = Data;

export default function PopularProductsWidget( props ) {
	const { Widget, WidgetNull } = props;

	const isGA4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const productBasePaths = useSelect( ( select ) =>
		select( CORE_SITE ).getProductBasePaths()
	);

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const reportOptions = {
		...dates,
		dimensions: [ 'pagePathPlusQueryString' ],
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [
			{
				metric: { metricName: 'screenPageViews' },
				desc: true,
			},
		],
		limit: 100,
	};

	const showWidget = isGA4ModuleConnected && productBasePaths?.length > 0;

	const report = useInViewSelect( ( select ) =>
		showWidget
			? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
			: undefined
	);

	const loading = useInViewSelect( ( select ) =>
		showWidget
			? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ reportOptions ]
			  )
			: undefined
	);

	if ( ! showWidget ) {
		return <WidgetNull />;
	}

	return (
		<Widget>
			<div>TODO: UI for PopularProductsWidget</div>
		</Widget>
	);
}

PopularProductsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};
