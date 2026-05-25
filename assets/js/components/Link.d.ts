/**
 * Link component type declarations.
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
import type {
	ForwardRefExoticComponent,
	MouseEventHandler,
	ReactNode,
	RefAttributes,
} from 'react';

export interface LinkProps {
	// NOTE: This is a temporary declaration file until Link.js is migrated to
	// TypeScript. Once migrated, avoid duplicating standard anchor/button attrs
	// here because React HTML attribute types will cover most of them.
	'aria-label'?: string;
	arrow?: boolean;
	back?: boolean;
	caps?: boolean;
	children?: ReactNode;
	className?: string;
	danger?: boolean;
	disabled?: boolean;
	external?: boolean;
	hideExternalIndicator?: boolean;
	href?: string;
	inverse?: boolean;
	leadingIcon?: ReactNode;
	linkButton?: boolean;
	noFlex?: boolean;
	onClick?: MouseEventHandler< HTMLAnchorElement | HTMLButtonElement >;
	small?: boolean;
	standalone?: boolean;
	to?: string;
	trailingIcon?: ReactNode;
	[ key: string ]: unknown;
}

declare const Link: ForwardRefExoticComponent<
	LinkProps & RefAttributes< HTMLAnchorElement | HTMLButtonElement >
>;

export default Link;
