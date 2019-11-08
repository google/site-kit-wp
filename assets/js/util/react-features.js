/**
 * External dependencies
 */
import {
	Suspense as ReactSuspense,
	lazy as ReactLazy,
} from 'react';

/**
 * WordPress dependencies
 */
import {
	Suspense as wpSuspense,
	lazy as wpLazy,
} from '@wordpress/element';

export const Suspense = !! wpSuspense ? wpSuspense : ReactSuspense;
export const lazy = !! wpLazy ? wpLazy : ReactLazy;
