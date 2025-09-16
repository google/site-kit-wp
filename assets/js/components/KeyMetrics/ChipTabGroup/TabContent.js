/**
 * TabContent component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * WordPress dependencies.
 */
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import MetricItem from '@/js/components/KeyMetrics/MetricsSelectionPanel/MetricItem';
import NoSelectedItemsSVG from '@/svg/graphics/key-metrics-no-selected-items.svg';
import P from '@/js/components/Typography/P';

export default function TabContent( {
	activeMetricItems,
	newlyDetectedMetrics,
	savedItemSlugs,
} ) {
	return (
		<div className="googlesitekit-chip-tab-group__tab-item">
			{ Object.keys( activeMetricItems ).map( ( slug ) => {
				const metricGroup = activeMetricItems[ slug ].group;
				const isNewlyDetected =
					newlyDetectedMetrics?.[ metricGroup ]?.includes( slug );

				return (
					<MetricItem
						key={ slug }
						slug={ slug }
						savedItemSlugs={ savedItemSlugs }
						isNewlyDetected={ isNewlyDetected }
						{ ...activeMetricItems[ slug ] }
					/>
				);
			} ) }
			{ ! Object.keys( activeMetricItems ).length && (
				<div className="googlesitekit-chip-tab-group__graphic">
					<NoSelectedItemsSVG height={ 250 } />
					<P>
						{ __(
							'No metrics were selected yet',
							'google-site-kit'
						) }
					</P>
				</div>
			) }
		</div>
	);
}

TabContent.propTypes = {
	activeMetricItems: PropTypes.object.isRequired,
	newlyDetectedMetrics: PropTypes.object.isRequired,
	savedItemSlugs: PropTypes.array,
};
