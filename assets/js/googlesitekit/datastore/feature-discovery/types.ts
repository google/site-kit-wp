/**
 * `core/feature-discovery` data store types.
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
import type { ComponentType, LazyExoticComponent } from 'react';

/**
 * Internal dependencies
 */
import type { Select } from 'googlesitekit-data';
import type {
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from './constants';

export type FeatureCategorySlug =
	typeof FEATURE_CATEGORIES[ keyof typeof FEATURE_CATEGORIES ];

export type FeatureEffort =
	typeof FEATURE_EFFORTS[ keyof typeof FEATURE_EFFORTS ];

export type FeatureSetupType =
	typeof FEATURE_SETUP_TYPES[ keyof typeof FEATURE_SETUP_TYPES ];

export interface FeatureScreenshot {
	src: string;
	alt: string;
	width: number;
	height: number;
}

export interface FeatureDetail {
	description?: {
		whatIs?: string;
		whyUseHeading?: string;
		whyUseList?: {
			term: string;
			description: string;
		}[];
	};
	requirements?: {
		serviceRequirements?: string;
		setupList?: string[];
		setupComplete?: string;
	};
	screenshots?: FeatureScreenshot[];
}

// TODO: Replace this with the success notice component's own props once that
// component exists, so the entry mirrors them directly.
export interface FeatureSuccessNotice {
	title: string;
	description?: string;
	cta?: {
		label: string;
		getURL?: ( select: Select ) => string | undefined;
		external?: boolean;
		onClick?: () => void;
	};
	dismissLabel?: string;
}

export interface FeatureSetup {
	type: FeatureSetupType;
	ctaLabel?: string;
	// The module to activate, for `setup-flow` features.
	moduleSlug?: string;
	// Target override for `setup-flow` features that are not module activation.
	getSetupURL?: ( select: Select ) => string | undefined;
	// The enable routine for `background-toggle` features.
	activate?: ( ...args: never[] ) => unknown;
	// Opens the existing surface over the hub, for `in-place-panel` features.
	open?: ( ...args: never[] ) => unknown;
	// Completion check, overriding the default module-connected check.
	isEnabled?: ( select: Select ) => boolean | undefined;
	// A `React.lazy()` reference, where setup can't be expressed as a thunk.
	SetupComponent?:
		| ComponentType< Record< string, unknown > >
		| LazyExoticComponent< ComponentType< Record< string, unknown > > >;
}

export interface FeatureSettings {
	title: string;
	shortDescription: string;
	effort: FeatureEffort;
	// The modules the feature depends on but does not itself set up.
	prerequisiteModules?: string[];
	// In order, the first being the feature's primary category.
	goalCategories: FeatureCategorySlug[];
	addedInVersion: string;
	setup: FeatureSetup;
	// Hides the feature entirely when it returns false. Visible by default.
	checkRequirements?: ( select: Select ) => boolean | undefined;
	detail?: FeatureDetail;
	// Static badges only. The "New" badge is derived per user.
	badges?: string[];
	successNotice?: FeatureSuccessNotice;
}

export interface Feature extends FeatureSettings {
	slug: string;
	prerequisiteModules: string[];
	badges: string[];
}

export interface FeatureCategory {
	slug: FeatureCategorySlug;
	title: string;
}

export interface FeatureDiscoveryState {
	features: Record< string, Feature >;
}
