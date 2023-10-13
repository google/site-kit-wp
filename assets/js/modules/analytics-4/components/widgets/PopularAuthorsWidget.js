/**
 * PopularAuthorsWidget component.
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
import { KM_ANALYTICS_POPULAR_AUTHORS } from '../../../../googlesitekit/datastore/user/constants';
import { MetricTileTable } from '../../../../components/KeyMetrics';
import { ZeroDataMessage } from '../../../analytics/components/common';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
import CustomDimensionsWrapper from '../common/CustomDimensionsWrapper';

function PopularAuthorsWidget( { Widget } ) {
	return (
		<CustomDimensionsWrapper widgetSlug={ KM_ANALYTICS_POPULAR_AUTHORS }>
			<MetricTileTable
				widgetSlug={ KM_ANALYTICS_POPULAR_AUTHORS }
				Widget={ Widget }
				ZeroState={ ZeroDataMessage }
				moduleSlug="analytics-4"
			/>
		</CustomDimensionsWrapper>
	);
}

PopularAuthorsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: 'analytics-4',
	FallbackComponent: ConnectGA4CTATileWidget,
} )( PopularAuthorsWidget );
