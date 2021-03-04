/**
 * Layout Component Stories.
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
import { storiesOf } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Layout from '../assets/js/components/layout/Layout';

storiesOf( 'Global/Layout', module )
	.add( 'Layout with Header Footer and CTAs', () => (
		<Layout
			header
			footer
			title={ __( 'Title', 'google-site-kit' ) }
			headerCTALabel={ __( 'Header CTA Label', 'google-site-kit' ) }
			headerCTALink="#"
			footerCTALabel={ __( 'Footer CTA Label', 'google-site-kit' ) }
			footerCTALink="#"
		>
			{ __( 'Child Content', 'google-site-kit' ) }
		</Layout>
	) )
	.add( 'Layout with Header and Footer', () => (
		<Layout
			header
			footer
			title={ __( 'Title', 'google-site-kit' ) }
			footerContent={ __( 'Footer Content', 'google-site-kit' ) }
		>
			{ __( 'Child Content', 'google-site-kit' ) }
		</Layout>
	) );
