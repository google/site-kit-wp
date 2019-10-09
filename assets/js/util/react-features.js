/**
 * External dependencies
 */
import {
	Suspense as ReactSuspense,
	lazy as ReactLazy,
	useEffect as ReactUseEffect,
	useState as ReactUseState,
} from 'react';

const {
	Suspense: wpSuspense,
	lazy: wpLazy,
	useEffect: wpUseEffect,
	useState: wpUseState,
} = wp.element;

export const Suspense = typeof wpSuspense === 'function' ? wpSuspense : ReactSuspense;
export const lazy = typeof wpLazy === 'function' ? wpLazy : ReactLazy;
export const useEffect = typeof wpUseEffect === 'function' ? wpUseEffect : ReactUseEffect;
export const useState = typeof wpUseState === 'function' ? wpUseState : ReactUseState;
