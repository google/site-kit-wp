/**
 * Site Goals Selection Panel Header component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SelectionPanelHeader } from '@/js/components/SelectionPanel';

export interface HeaderProps {
	closePanel: () => void;
}

const Header: FC< HeaderProps > = ( { closePanel } ) => {
	return (
		<SelectionPanelHeader
			title={ __( 'Select metrics', 'google-site-kit' ) }
			onCloseClick={ closePanel }
		/>
	);
};

export default Header;
