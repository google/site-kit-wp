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
 * External dependencies
 */
import CTA from 'GoogleComponents/notifications/cta';
import ctaWrapper from 'GoogleComponents/notifications/cta-wrapper';

const { __, sprintf } = wp.i18n;

/**
 * Creates a CTA component when no data is available.
 *
 * @param {string}  moduleName Name of module, translated.
 * @param {boolean} inGrid     Creates layout to fit within an existing grid with 'cell' classes. Default is half-width grid cells. Default: false.
 * @param {boolean} fullWidth  Creates layout with 'cell--span-12' to be full width. Default: false.
 * @param {boolean} createGrid Adds a full grid layout with padding. Default: false.
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
