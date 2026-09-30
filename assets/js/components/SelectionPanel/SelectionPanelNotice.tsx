/**
 * Selection Panel Notice
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import type { ComponentPropsWithoutRef, ComponentRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Notice from '@/js/components/Notice';
import { NOTICE_VARIANTS } from '@/js/components/Notice/constants';

const SelectionPanelNotice = forwardRef<
	ComponentRef< typeof Notice >,
	ComponentPropsWithoutRef< typeof Notice >
>( ( props, ref ) => {
	return (
		<Notice
			variant={ NOTICE_VARIANTS.SIDE_PANEL }
			{ ...props }
			ref={ ref }
		/>
	);
} );

export default SelectionPanelNotice;
