<?php
/**
 * Base template for the error-email.
 *
 * This template is used to notify users when email report generation fails.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var array $data All template data including metadata.
 */

// Extract metadata from data.
$subject            = $data['subject'];
$preheader          = $data['preheader'];
$site_domain        = $data['site']['domain'];
$site_url           = $data['site']['url'];
$email_title        = $data['title'];
$body               = $data['body'];
$cta                = $data['primary_call_to_action'];
$footer             = $data['footer'];
$get_asset_url      = $data['get_asset_url'];
$render_part        = $data['render_part'];
$render_shared_part = $data['render_shared_part'];
?>
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
	<meta name="viewport" content="width=device-width" />
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<?php /* Enable dark mode support in email clients that honor these meta tags. */ ?>
	<meta name="color-scheme" content="light dark" />
	<meta name="supported-color-schemes" content="light dark" />
	<?php /* Outlook requires this VML to prevent visual bugs when DPI is scaled on Windows. */ ?>
	<!--[if gte mso 9]>
	<xml>
		<o:OfficeDocumentSettings>
			<o:AllowPNG/>
			<o:PixelsPerInch>96</o:PixelsPerInch>
		</o:OfficeDocumentSettings>
	</xml>
	<![endif]-->
	<title><?php echo esc_html( $subject ); ?></title>
	<style>
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

			.dm-card {
				background-color: #161B18 !important;
				box-shadow: inset 0 0 0 9999px #161B18 !important;
			}

			/* Force card descendants transparent so parent box-shadow shows through */
			.dm-card table,
			.dm-card tr,
			.dm-card td,
			.dm-card div,
			.dm-card p,
			.dm-card h1,
			.dm-card h2,
			.dm-card h3 {
				background-color: transparent !important;
				box-shadow: none !important;
			}

			.dm-text-primary {
				color: #EBEEF0 !important;
			}

			.dm-text-secondary {
				color: #999F9B !important;
			}

			.dm-link {
				color: #93C9A8 !important;
			}

			.dm-button {
				background-color: #93C9A8 !important;
				box-shadow: inset 0 0 0 9999px #93C9A8 !important;
				color: #161B18 !important;
			}
		}

		/* Outlook app dark mode targeting via data-ogsc attribute */
		[data-ogsc] body,
		[data-ogsc] .body {
			background-color: #232824 !important;
			box-shadow: inset 0 0 0 9999px #232824 !important;
		}

		[data-ogsc] .dm-card {
			background-color: #161B18 !important;
			box-shadow: inset 0 0 0 9999px #161B18 !important;
		}

		/* Force card descendants transparent so parent box-shadow shows through */
		[data-ogsc] .dm-card table,
		[data-ogsc] .dm-card tr,
		[data-ogsc] .dm-card td,
		[data-ogsc] .dm-card div,
		[data-ogsc] .dm-card p,
		[data-ogsc] .dm-card h1,
		[data-ogsc] .dm-card h2,
		[data-ogsc] .dm-card h3 {
			background-color: transparent !important;
			box-shadow: none !important;
		}

		[data-ogsc] .dm-text-primary {
			color: #EBEEF0 !important;
		}

		[data-ogsc] .dm-text-secondary {
			color: #999F9B !important;
		}

		[data-ogsc] .dm-link {
			color: #93C9A8 !important;
		}

		[data-ogsc] .dm-button {
			background-color: #93C9A8 !important;
			box-shadow: inset 0 0 0 9999px #93C9A8 !important;
			color: #161B18 !important;
		}
	</style>
</head>
<body>
	<span class="preheader"><?php echo esc_html( $preheader ); ?></span>
	<?php /* Outlook centering: use fixed-width table wrapper. */ ?>
	<!--[if mso]>
	<table role="presentation" align="center" width="520" cellpadding="0" cellspacing="0" border="0" style="width:520px;">
	<tr>
	<td align="center">
	<![endif]-->
	<table role="presentation" class="body" align="center" width="100%" style="max-width: 520px; margin: 0 auto;">
		<tr>
			<td>&nbsp;</td>
			<td class="container" align="center">
				<table role="presentation" class="main" align="center">
					<tr>
						<td class="wrapper">
							<?php
							// Render header (Site Kit logo).
							$render_part(
								'header',
								array(
									'get_asset_url' => $get_asset_url,
								)
							);
							?>
							<?php
							// Render content (warning icon, domain, title, body, CTA).
							$render_part(
								'content',
								array(
									'site_domain'        => $site_domain,
									'site_url'           => $site_url,
									'title'              => $email_title,
									'body'               => $body,
									'cta'                => $cta,
									'get_asset_url'      => $get_asset_url,
									'render_shared_part' => $render_shared_part,
								)
							);
							?>
							<?php
							// Render full footer (unsubscribe, links) without CTA since it's already in the content.
							$render_shared_part(
								'footer',
								array(
									'cta'                => array(), // CTA is in content, not footer.
									'footer'             => $footer,
									'render_shared_part' => $render_shared_part,
								)
							);
							?>
						</td>
					</tr>
				</table>
			</td>
			<td>&nbsp;</td>
		</tr>
	</table>
	<!--[if mso]>
	</td>
	</tr>
	</table>
	<![endif]-->
</body>
</html>
