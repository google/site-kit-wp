<?php
/**
 * Shared styles for email templates.
 *
 * Contains base layout styles and dark mode accommodations used across all email templates.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

?>
		:root {
			color-scheme: light dark;
		}

		body {
			background-color: #F3F5F7;
			margin: 0;
			padding: 0;
			font-family: 'Google Sans', Roboto, Arial, sans-serif;
			font-size: 14px;
			line-height: 1.4;
			color: #202124;
		}

		table {
			border-spacing: 0;
			border-collapse: separate;
			width: 100%;
		}

		img {
			border: 0;
			max-width: 100%;
			height: auto;
			line-height: 100%;
		}

		.body {
			width: 100%;
			max-width: 520px;
			background-color: #F3F5F7;
		}

		.container {
			max-width: 520px;
			margin: 0 auto;
			padding: 0;
			width: 100%;
			box-sizing: border-box;
		}

		.main {
			width: 100%;
			max-width: 520px;
			margin: 0 auto;
		}

		.wrapper {
			box-sizing: border-box;
			padding: 0 16px 40px 16px;
		}

		.preheader {
			display: none !important;
			visibility: hidden;
			mso-hide: all;
			font-size: 1px;
			color: #F3F5F7;
			line-height: 1px;
			max-height: 0;
			max-width: 0;
			opacity: 0;
			overflow: hidden;
		}

		/* Dark mode styles for email clients that support prefers-color-scheme */
		@media (prefers-color-scheme: dark) {
			body,
			.body {
				background-color: #232824 !important;
				box-shadow: inset 0 0 0 9999px #232824 !important;
			}

			.card {
				background-color: #161B18 !important;
				box-shadow: inset 0 0 0 9999px #161B18 !important;
			}

			/* Force card descendants to have transparent backgrounds so the parents' `box-shadow` shows through */
			.card table,
			.card tr,
			.card td,
			.card div,
			.card p,
			.card h1,
			.card h2,
			.card h3 {
				background-color: transparent !important;
				box-shadow: none !important;
			}

			/* Keep notice cards visible in dark mode. */
			.googlesitekit-email-report-notice .googlesitekit-email-report-notice-surface {
				background-color: #E3D1FF !important;
				box-shadow: inset 0 0 0 9999px #E3D1FF !important;
			}

			.text-primary {
				color: #EBEEF0 !important;
			}

			.text-secondary {
				color: #999F9B !important;
			}

			.link {
				color: #93C9A8 !important;
			}

			.button {
				background-color: #93C9A8 !important;
				box-shadow: inset 0 0 0 9999px #93C9A8 !important;
				color: #161B18 !important;
			}

			/* Badge adjustments for dark mode - inverted colors for contrast */
			.badge-positive {
				background-color: #1F4C04 !important;
				box-shadow: inset 0 0 0 9999px #1F4C04 !important;
				color: #D8FFC0 !important;
			}

			.badge-negative {
				background-color: #7A1E00 !important;
				box-shadow: inset 0 0 0 9999px #7A1E00 !important;
				color: #FFDED3 !important;
			}

			/* Border color */
			.border {
				border-color: #2D332F !important;
			}
		}

		/* Outlook app dark mode targeting via data-ogsc attribute */
		[data-ogsc] body,
		[data-ogsc] .body {
			background-color: #232824 !important;
			box-shadow: inset 0 0 0 9999px #232824 !important;
		}

		[data-ogsc] .card {
			background-color: #161B18 !important;
			box-shadow: inset 0 0 0 9999px #161B18 !important;
		}

		/* Force card descendants to have transparent backgrounds so the parents' `box-shadow` shows through */
		[data-ogsc] .card table,
		[data-ogsc] .card tr,
		[data-ogsc] .card td,
		[data-ogsc] .card div,
		[data-ogsc] .card p,
		[data-ogsc] .card h1,
		[data-ogsc] .card h2,
		[data-ogsc] .card h3 {
			background-color: transparent !important;
			box-shadow: none !important;
		}

		/* Keep notice cards visible in Outlook app dark mode. */
		[data-ogsc] .googlesitekit-email-report-notice .googlesitekit-email-report-notice-surface {
			background-color: #E3D1FF !important;
			box-shadow: inset 0 0 0 9999px #E3D1FF !important;
		}

		[data-ogsc] .text-primary {
			color: #EBEEF0 !important;
		}

		[data-ogsc] .text-secondary {
			color: #999F9B !important;
		}

		[data-ogsc] .link {
			color: #93C9A8 !important;
		}

		[data-ogsc] .button {
			background-color: #93C9A8 !important;
			box-shadow: inset 0 0 0 9999px #93C9A8 !important;
			color: #161B18 !important;
		}

		[data-ogsc] .badge-positive {
			background-color: #1F4C04 !important;
			box-shadow: inset 0 0 0 9999px #1F4C04 !important;
			color: #D8FFC0 !important;
		}

		[data-ogsc] .badge-negative {
			background-color: #7A1E00 !important;
			box-shadow: inset 0 0 0 9999px #7A1E00 !important;
			color: #FFDED3 !important;
		}

		[data-ogsc] .border {
			border-color: #2D332F !important;
		}

		@media (min-width: 481px) {
			.subtitle {
				/* `!important` used to override inline styles in the element. */
				width: auto !important;
			}
		}
