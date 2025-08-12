/**
 * Keyboard Shortcut Demo component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Cell, Grid, Row } from '../../material-components';
import Layout from '../layout/Layout';
import { useKeyboardShortcuts } from './KeyboardShortcutProvider';
import useViewContext from '../../hooks/useViewContext';

export default function KeyboardShortcutDemo() {
	const { setIsHelpVisible } = useKeyboardShortcuts();
	const viewContext = useViewContext();

	const handleShowHelp = () => {
		setIsHelpVisible( true );
	};

	return (
		<Layout className="googlesitekit-keyboard-shortcuts-demo">
			<Grid>
				<Row>
					<Cell size={ 12 }>
						<div className="googlesitekit-widget-area">
							<div className="googlesitekit-widget-area__header">
								<h3 className="googlesitekit-widget-area__title">
									{ __(
										'Keyboard Shortcuts Demo',
										'google-site-kit'
									) }
								</h3>
							</div>
							<div className="googlesitekit-widget-area__body">
								<p>
									{ __(
										'Keyboard shortcuts are now enabled! Try these shortcuts:',
										'google-site-kit'
									) }
								</p>

								<div className="googlesitekit-keyboard-shortcuts-demo__shortcuts">
									<div className="googlesitekit-keyboard-shortcuts-demo__shortcut">
										<strong>Ctrl/Cmd + K</strong> -{ ' ' }
										{ __(
											'Open command palette (search for any page)',
											'google-site-kit'
										) }
									</div>
									<div className="googlesitekit-keyboard-shortcuts-demo__shortcut">
										<strong>Ctrl/Cmd + /</strong> or{ ' ' }
										<strong>Ctrl/Cmd + Shift + ?</strong> -{ ' ' }
										{ __(
											'Show keyboard shortcuts help',
											'google-site-kit'
										) }
									</div>
									{ viewContext === 'settings' && (
										<>
											<div className="googlesitekit-keyboard-shortcuts-demo__shortcut">
												<strong>Ctrl/Cmd + 1</strong> -{ ' ' }
												{ __(
													'Connected Services tab',
													'google-site-kit'
												) }
											</div>
											<div className="googlesitekit-keyboard-shortcuts-demo__shortcut">
												<strong>Ctrl/Cmd + 2</strong> -{ ' ' }
												{ __(
													'Connect More Services tab',
													'google-site-kit'
												) }
											</div>
											<div className="googlesitekit-keyboard-shortcuts-demo__shortcut">
												<strong>Ctrl/Cmd + 3</strong> -{ ' ' }
												{ __(
													'Admin Settings tab',
													'google-site-kit'
												) }
											</div>
										</>
									) }
									{ viewContext === 'dashboard' && (
										<>
											<div className="googlesitekit-keyboard-shortcuts-demo__shortcut">
												<strong>K</strong> -{ ' ' }
												{ __(
													'Navigate to Key Metrics',
													'google-site-kit'
												) }
											</div>
											<div className="googlesitekit-keyboard-shortcuts-demo__shortcut">
												<strong>T</strong> -{ ' ' }
												{ __(
													'Navigate to Traffic',
													'google-site-kit'
												) }
											</div>
											<div className="googlesitekit-keyboard-shortcuts-demo__shortcut">
												<strong>C</strong> -{ ' ' }
												{ __(
													'Navigate to Content',
													'google-site-kit'
												) }
											</div>
										</>
									) }
									<div className="googlesitekit-keyboard-shortcuts-demo__shortcut">
										<strong>Ctrl/Cmd + Shift + G</strong> -{ ' ' }
										{ __(
											'Go to Dashboard',
											'google-site-kit'
										) }
									</div>
									<div className="googlesitekit-keyboard-shortcuts-demo__shortcut">
										<strong>Ctrl/Cmd + Shift + S</strong> -{ ' ' }
										{ __(
											'Go to Settings',
											'google-site-kit'
										) }
									</div>
								</div>

								<p>
									<button
										type="button"
										className="googlesitekit-button googlesitekit-button--primary"
										onClick={ handleShowHelp }
									>
										{ __(
											'Show All Shortcuts',
											'google-site-kit'
										) }
									</button>
								</p>

								<p className="googlesitekit-keyboard-shortcuts-demo__test">
									{ __(
										'Test the shortcuts by pressing them on your keyboard, or click the button above.',
										'google-site-kit'
									) }
								</p>

								<p className="googlesitekit-keyboard-shortcuts-demo__note">
									{ __(
										'Note: Shortcuts will not work when typing in input fields.',
										'google-site-kit'
									) }
								</p>
							</div>
						</div>
					</Cell>
				</Row>
			</Grid>
		</Layout>
	);
}
