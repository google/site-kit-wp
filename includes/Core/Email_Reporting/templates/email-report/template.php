<?php
/**
 * Base template for the email-report email.
 *
 * This template receives $data containing both metadata and $sections.
 * Sections are already processed with their rendered parts.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var array $data All template data including metadata and sections.
 */

// Extract metadata from data.
// These keys are always present as they are mapped in Email_Template_Data,
// so we access them directly without checking for existence.
$subject            = $data['subject'];
$preheader          = $data['preheader'];
$site_domain        = $data['site']['domain'];
$date_label         = $data['date_range']['label'];
$primary_cta        = $data['primary_call_to_action'];
$footer_content     = $data['footer'];
$sections           = $data['sections'];
$get_asset_url      = $data['get_asset_url'];
$render_part        = $data['render_part'];
$render_shared_part = $data['render_shared_part'];
?>
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
	<meta name="viewport" content="width=device-width" />
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
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
			color-scheme: light;
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
			<?php /* Outlook only allows max-width when set on table elements. */ ?>
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
							// Render header.
							$render_part(
								'header',
								array(
									'site_domain'   => $site_domain,
									'date_label'    => $date_label,
									'get_asset_url' => $get_asset_url,
								)
							);

							// Render each section with its parts.
							foreach ( $sections as $section_key => $section ) {
								// Skip sections without parts.
								if ( empty( $section['section_parts'] ) ) {
									continue;
								}

								// If a section_template is specified, use it to render the entire section.
								if ( ! empty( $section['section_template'] ) ) {
									$render_part(
										$section['section_template'],
										array(
											'section'     => $section,
											'render_part' => $render_part,
											'render_shared_part' => $render_shared_part,
											'get_asset_url' => $get_asset_url,
										)
									);
									continue;
								}
							}

							// Render footer.
							$render_shared_part(
								'footer',
								array(
									'cta'                => $primary_cta,
									'footer'             => $footer_content,
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
