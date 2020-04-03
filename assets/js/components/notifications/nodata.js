/**
 * getNoDataComponent function.
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
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CTA from './cta';
import ctaWrapper from './cta-wrapper';

/**
 * Creates a CTA component when no data is available.
 *
 * @param {string}  moduleName Name of module, translated.
 * @param {boolean} inGrid     Creates layout to fit within an existing grid with 'cell' classes. Default is half-width grid cells. Default: false.
 * @param {boolean} fullWidth  Creates layout with 'cell--span-12' to be full width. Default: false.
 * @param {boolean} createGrid Adds a full grid layout with padding. Default: false.
 *
 * @return {WPElement} Returns CTA component with no data fallback notification.
 */
const getNoDataComponent = ( moduleName, inGrid = false, fullWidth = false, createGrid = false ) => {
	const cta = <CTA

		/* translators: %s: Module name */
		title={ sprintf( __( '%s Gathering Data', 'google-site-kit' ), moduleName ) }

		/* translators: %s: Module name */
		description={ sprintf( __( '%s data is not yet available, please check back later.', 'google-site-kit' ), moduleName ) }
	/>;

	return ctaWrapper( cta, inGrid, fullWidth, createGrid );
};

export default getNoDataComponent;
