/**
 * Module setup component types.
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
import type { ComponentType, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { Registry } from 'googlesitekit-data';
import type { FinishSetupCallback } from './hooks/types';

/**
 * Callback registered via `registerModule` for the footer complete action.
 *
 * @since n.e.x.t
 */
export type OnCompleteSetupCallback = (
	registry: Registry,
	finishSetup: FinishSetupCallback
) => void | Promise< void >;

/**
 * Minimal module shape required by setup primitives.
 *
 * @since n.e.x.t
 */
export interface ModuleWithSetupComponent {
	slug: string;
	storeName: string;
	SetupComponent: ComponentType< {
		module: ModuleWithSetupComponent;
		finishSetup: FinishSetupCallback;
	} >;
	onCompleteSetup?: OnCompleteSetupCallback;
	[ key: string ]: unknown;
}

/**
 * Props passed to a module's `SetupComponent`.
 *
 * @since n.e.x.t
 */
export interface ModuleSetupComponentProps {
	module: ModuleWithSetupComponent;
	finishSetup: FinishSetupCallback;
}

/**
 * Props for `SetupHeader`.
 *
 * @since n.e.x.t
 */
export interface SetupHeaderProps {
	children?: ReactNode;
}

/**
 * Props for `SetupFooter`.
 *
 * @since n.e.x.t
 */
export interface SetupFooterProps {
	moduleSlug: string;
	finishSetup: FinishSetupCallback;
	onCancel: () => void | Promise< void >;
}

/**
 * Props for module setup layout components (`DefaultModuleSetup`, `SetupLayout`).
 *
 * @since n.e.x.t
 */
export interface ModuleSetupLayoutProps {
	moduleSlug: string;
}
