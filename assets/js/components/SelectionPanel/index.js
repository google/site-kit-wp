/**
 * Selection Panel
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import SideSheet from '../SideSheet';
import Header from './Header';

export default function SelectionPanel( {
	onSideSheetOpen,
	sideSheetCloseFn,
	isOpen,
} ) {
	return (
		<SideSheet
			className="googlesitekit-km-selection-panel"
			isOpen={ isOpen }
			onOpen={ onSideSheetOpen }
			closeFn={ sideSheetCloseFn }
			focusTrapOptions={ {
				initialFocus:
					'.googlesitekit-km-selection-panel-metrics__metric-item .googlesitekit-selection-box input',
			} }
		>
			<Header />
		</SideSheet>
	);
}
