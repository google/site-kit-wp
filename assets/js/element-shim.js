/**
 * WordPress Element shim.
 *
 * A temporary workaround to ensure the same version of React
 * is always used across multiple entrypoints.
 *
 * @private
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

import * as element from '@wordpress/element__non-shim';

if ( global.googlesitekit === undefined ) {
	global.googlesitekit = {};
}

const {
	__experimentalCreateInterpolateElement,
	Children,
	cloneElement,
	Component,
	concatChildren,
	createContext,
	createElement,
	createPortal,
	createRef,
	findDOMNode,
	forwardRef,
	Fragment,
	isEmptyElement,
	isValidElement,
	lazy,
	memo,
	Platform,
	RawHTML,
	render,
	renderToString,
	StrictMode,
	Suspense,
	switchChildrenNodeName,
	unmountComponentAtNode,
	useCallback,
	useContext,
	useDebugValue,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} = global.googlesitekit._element || element;

export {
	__experimentalCreateInterpolateElement,
	Children,
	cloneElement,
	Component,
	concatChildren,
	createContext,
	createElement,
	createPortal,
	createRef,
	findDOMNode,
	forwardRef,
	Fragment,
	isEmptyElement,
	isValidElement,
	lazy,
	memo,
	Platform,
	RawHTML,
	render,
	renderToString,
	StrictMode,
	Suspense,
	switchChildrenNodeName,
	unmountComponentAtNode,
	useCallback,
	useContext,
	useDebugValue,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
};

if ( global.googlesitekit._element === undefined ) {
	global.googlesitekit._element = {
		__experimentalCreateInterpolateElement,
		Children,
		cloneElement,
		Component,
		concatChildren,
		createContext,
		createElement,
		createPortal,
		createRef,
		findDOMNode,
		forwardRef,
		Fragment,
		isEmptyElement,
		isValidElement,
		lazy,
		memo,
		Platform,
		RawHTML,
		render,
		renderToString,
		StrictMode,
		Suspense,
		switchChildrenNodeName,
		unmountComponentAtNode,
		useCallback,
		useContext,
		useDebugValue,
		useEffect,
		useImperativeHandle,
		useLayoutEffect,
		useMemo,
		useReducer,
		useRef,
		useState,
	};
}
