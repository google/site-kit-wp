import { useBreakpoint } from '../hooks/useBreakpoint';

/* 
$width-xsmall: 450;
$width-tablet: 600;
$width-wpAdminBarTablet: 783;
$width-desktop: 960;
$width-xlarge: 1280;
$width-xxlarge: 1440;

// Custom Media Breakpoints
$bp-xsmallOnly: $width-xsmall - 1 + px;
$bp-mobileOnly: $width-tablet - 1 + px;
$bp-tablet: $width-tablet + px;
$bp-nonMobile: $width-tablet + 1 + px;
$bp-nonTablet: $width-desktop + 1 + px;
$bp-wpAdminBarTablet: $width-wpAdminBarTablet + px;
$bp-desktop: $width-desktop + px;
$bp-xlarge: $width-xlarge + px;
$bp-xxlarge: $width-xxlarge + px;
 */

export default function BreakpointDebug() {
	const breakpoint = useBreakpoint();

	return (
		<div id="breakpointdebug">
			<div className="breakpoints">
				<span data-breakpoint="xsmall">xsmall</span>
				<span data-breakpoint="tablet">tablet</span>
				<span data-breakpoint="wpAdminBarTablet">wpAdminBarTablet</span>
				<span data-breakpoint="desktop">desktop</span>
				<span data-breakpoint="xlarge">xlarge</span>
				<span data-breakpoint="xxlarge">xxlarge</span>
			</div>
			<pre>
				{ `breakpoint:  ${ breakpoint }` +
					'\n' +
					`innerWidth:  ${ global.innerWidth }` +
					'\n' +
					`clientWidth: ${ global.document.documentElement.clientWidth }` }
			</pre>
		</div>
	);
}
