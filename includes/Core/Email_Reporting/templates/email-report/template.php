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
$subject        = $data['subject'];
$preheader      = $data['preheader'];
$site_domain    = $data['site']['domain'];
$date_label     = $data['date_range']['label'];
$primary_cta    = $data['primary_call_to_action'];
$footer_content = $data['footer'];
$sections       = $data['sections'];
$get_asset_url  = $data['get_asset_url'];

// Helper function to render a part with variables.
$render_part = static function ( $file, array $vars = array() ) {
	if ( ! file_exists( $file ) ) {
		return;
	}
	extract( $vars, EXTR_SKIP ); // phpcs:ignore WordPress.PHP.DontExtract.extract_extract
	include $file;
};

// Asset paths.
$plugin_dir         = dirname( dirname( dirname( __DIR__ ) ) );
$shared_parts_dir   = $plugin_dir . '/Email_Reporting/templates/parts';
$template_parts_dir = __DIR__ . '/parts';
?>
<!doctype html>
<html>
<head>
	<meta name="viewport" content="width=device-width" />
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
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
	<table role="presentation" class="body">
		<tr>
			<td>&nbsp;</td>
			<td class="container">
				<table role="presentation" class="main">
					<tr>
						<td class="wrapper">
							<?php
							// Render header.
							$render_part(
								$template_parts_dir . '/header.php',
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
									$section_template_file = $template_parts_dir . '/' . $section['section_template'] . '.php';
									if ( file_exists( $section_template_file ) ) {
										$render_part(
											$section_template_file,
											array(
												'section' => $section,
												'render_part' => $render_part,
												'get_asset_url' => $get_asset_url,
												'template_parts_dir' => $template_parts_dir,
												'shared_parts_dir' => $shared_parts_dir,
											)
										);
									}
									continue;
								}

								// Fallback: render section header and parts individually.
								if ( ! empty( $section['title'] ) ) {
									$icon_url = $get_asset_url( 'icon-' . $section['icon'] . '.png' );
									$render_part(
										$template_parts_dir . '/section-header.php',
										array(
											'icon'     => $icon_url,
											'title'    => $section['title'],
											'subtitle' => '',
										)
									);

									foreach ( $section['section_parts'] as $part_key => $part_config ) {
										// Skip if no data or template for this part.
										if ( empty( $part_config['data'] ) || empty( $part_config['template'] ) ) {
											continue;
										}

										// Render the part template with its data.
										$part_template_file = $template_parts_dir . '/' . $part_config['template'] . '.php';
										if ( file_exists( $part_template_file ) ) {
											$render_part(
												$part_template_file,
												array( 'data' => $part_config['data'] )
											);
										}
									}
								}
							}

							// Render footer.
							$render_part(
								$shared_parts_dir . '/footer.php',
								array(
									'cta'              => $primary_cta,
									'footer'           => $footer_content,
									'shared_parts_dir' => $shared_parts_dir,
									'render_part'      => $render_part,
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
</body>
</html>
