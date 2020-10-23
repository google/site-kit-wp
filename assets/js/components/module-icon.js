/**
 * ModuleIcon component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import AdSenseIcon from '../../svg/adsense.svg';
import AnalyticsIcon from '../../svg/analytics.svg';
import OptimizeIcon from '../../svg/optimize.svg';
import PageSpeedInsightsIcon from '../../svg/pagespeed-insights.svg';
import SearchConsoleIcon from '../../svg/search-console.svg';
import TagManagerIcon from '../../svg/tagmanager.svg';

const moduleMap = {
	adsense: AdSenseIcon,
	analytics: AnalyticsIcon,
	optimize: OptimizeIcon,
	'pagespeed-insights': PageSpeedInsightsIcon,
	'search-console': SearchConsoleIcon,
	tagmanager: TagManagerIcon,
};

export default function ModuleIcon( { slug, width = 33, height = 33, ...props } ) {
	if ( ! moduleMap.hasOwnProperty( slug ) ) {
		return null;
	}

	const ModuleIconComponent = moduleMap[ slug ];

	return (
		<ModuleIconComponent
			width={ width }
			height={ height }
			{ ...props }
		/>
	);
}

ModuleIcon.propTypes = {
	slug: PropTypes.string,
	width: PropTypes.number,
	height: PropTypes.number,
};
