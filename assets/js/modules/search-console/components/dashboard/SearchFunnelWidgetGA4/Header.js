/**
 * Header component for SearchFunnelWidgetGA4.
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
 * WordPress dependencies
 */
import { sprintf, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import WidgetHeaderTitle from '../../../../../googlesitekit/widgets/components/WidgetHeaderTitle';
import Data from 'googlesitekit-data';
const { useSelect } = Data;

function Header() {
	const currentDayCount = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeNumberOfDays()
	);

	return (
		<WidgetHeaderTitle
			title={ sprintf(
				/* translators: %s: number of days */
				_n(
					'Search traffic over the last %s day',
					'Search traffic over the last %s days',
					currentDayCount,
					'google-site-kit'
				),
				currentDayCount
			) }
		/>
	);
}

export default Header;
