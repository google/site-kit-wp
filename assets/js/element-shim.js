/**
 * WordPress Element shim.
 *
 * A temporary workaround to ensure the same version of React
 * is always used across multiple entrypoints.
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
 *
 * @since 1.7.1
 * @private
 */

import * as element from '@wordpress/element__non-shim';

if ( global.googlesitekit === undefined ) {
	global.googlesitekit = {};
}

const {
	Children,
	cloneElement,
	Component,
	concatChildren,
	createContext,
	createElement,
	createInterpolateElement,
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
	Children,
	cloneElement,
	Component,
	concatChildren,
	createContext,
	createElement,
	createInterpolateElement,
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
		Children,
		cloneElement,
		Component,
		concatChildren,
		createContext,
		createElement,
		createInterpolateElement,
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
