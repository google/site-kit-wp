/* eslint-disable valid-jsdoc */ // Disabled to allow type imports below.
/* eslint-disable jsdoc/valid-types */
/**
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
 * External dependencies
 */
import invariant from 'invariant';
import { isPlainObject, merge } from 'lodash';

/**
 * Internal dependencies
 */
import { PAX_GLOBAL_CONFIG } from './constants';

/**
 * Creates PAX configuration.
 *
 * @since 1.128.1
 *
 * @param {Object}                                                                                options                  Optional.
 * @param {string}                                                                                options.contentContainer Optional. The container selector to launch the Ads app.
 * @param {import('google-pax-sdk/sdk/config/config.d.ts').google.ads.integration.ReportingStyle} options.reportingStyle   Optional. The campaign reporting style.
 * @return {import('google-pax-sdk/sdk/config/config.d.ts').google.ads.integration.Config} Configuration.
 */
export function createPaxConfig( options = {} ) {
	const { contentContainer, reportingStyle, _global = global } = options;

	const baseConfig = _global?.[ PAX_GLOBAL_CONFIG ];

	invariant(
		isPlainObject( baseConfig ),
		'base PAX config must be a plain object'
	);

	return merge(
		baseConfig,
		contentContainer
			? {
					clientConfig: {
						contentContainer,
					},
			  }
			: {},
		reportingStyle
			? {
					contentConfig: {
						partnerAdsExperienceConfig: {
							reportingStyle,
						},
					},
			  }
			: {}
	);
}
