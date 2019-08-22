/**
 * GoogleSitekitSearchConsoleAdminbarWidget component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
 * Internal dependencies
 */
import SearchConsoleAdminbarWidgetOverview from './adminbar-widget-overview';

import { Component } from '@wordpress/element';

class GoogleSitekitSearchConsoleAdminbarWidget extends Component {
	render() {
		if ( typeof googlesitekit.permaLink !== typeof undefined && '' === googlesitekit.permaLink ) {
			return null;
		}

		return (
			<SearchConsoleAdminbarWidgetOverview />
		);
	}
}

export default GoogleSitekitSearchConsoleAdminbarWidget;
