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

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import LabReportMetrics from '../../common/LabReportMetrics';
import FieldReportMetrics from '../../common/FieldReportMetrics';
import Recommendations from '../../common/Recommendations';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import {
	STRATEGY_MOBILE,
	DATA_SRC_FIELD,
	DATA_SRC_LAB,
	DATA_SRC_RECOMMENDATIONS,
	UI_STRATEGY,
	UI_DATA_SOURCE,
} from '../../../datastore/constants';

export default function Content( {
	isFetching,
	recommendations,
	reportData,
	reportError,
} ) {
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

	return (
		<section
			className={ classnames( {
				'googlesitekit-pagespeed-widget__refreshing': isFetching,
			} ) }
		>
			{ dataSrc === DATA_SRC_LAB && (
				<LabReportMetrics data={ reportData } error={ reportError } />
			) }
			{ dataSrc === DATA_SRC_FIELD && (
				<FieldReportMetrics data={ reportData } error={ reportError } />
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
	);
}
