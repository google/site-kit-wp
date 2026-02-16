<?php
/**
 * Base template for the invitation-email.
 *
 * This template is used to invite users to receive periodic performance reports.
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
$body               = $data['body'];
$inviter_email      = $data['inviter_email'];
$learn_more_url     = $data['learn_more_url'];
$primary_cta        = $data['primary_call_to_action'];
$footer_copy        = $data['footer']['copy'];
$get_asset_url      = $data['get_asset_url'];
$render_part        = $data['render_part'];
$render_shared_part = $data['render_shared_part'];

$envelope_url = $get_asset_url( 'invitation-envelope-graphic' );
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
							// Render header (Site Kit logo).
							$render_part(
								'header',
								array(
									'get_asset_url' => $get_asset_url,
								)
							);
							?>
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
								<tr>
									<td style="background-color: #FFFFFF; border-radius: 16px; padding: 24px 24px 0 24px;">
										<?php /* Site domain. */ ?>
										<p style="font-size: 14px; line-height: 20px; font-weight: 400; color: #6C726E; margin: 0 0 8px 0;">
											<a href="<?php echo esc_url( $site_url ); ?>" style="color: #6C726E; text-decoration: none;"><?php echo esc_html( $site_domain ); ?></a>
										</p>

										<?php /* Invitation title. */ ?>
										<h1 style="font-size: 22px; line-height: 28px; font-weight: 500; color: #161B18; margin: 0 0 16px 0;">
											<?php
											printf(
												/* translators: %s: Email address of the person who sent the invitation (wrapped in mailto link) */
												esc_html__( '%s invited you to receive periodic performance reports', 'google-site-kit' ),
												/* Mailto link styled to match title text as inline styles prevent email clients from auto-styling the email address as a blue link. */
												'<a href="mailto:' . esc_attr( $inviter_email ) . '" style="color: #161B18; text-decoration: none; font-weight: 500;">' . esc_html( $inviter_email ) . '</a>'
											);
											?>
										</h1>

										<?php /* Body paragraphs from Body_Content_Map. */ ?>
										<?php foreach ( $body as $index => $paragraph ) : ?>
										<p style="font-size: 14px; line-height: 20px; font-weight: 400; color: #161B18; margin: 0 0 16px 0;">
											<?php echo esc_html( $paragraph ); ?>
											<?php if ( 0 === $index && ! empty( $learn_more_url ) ) : ?>
											<a href="<?php echo esc_url( $learn_more_url ); ?>" style="color: #108080; text-decoration: none;" target="_blank" rel="noopener"><?php echo esc_html__( 'Learn more', 'google-site-kit' ); ?></a>
											<?php endif; ?>
										</p>
										<?php endforeach; ?>

										<?php /* CTA Button. */ ?>
										<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
											<tr>
												<td>
													<?php
													$render_shared_part(
														'dashboard-link',
														array(
															'url'   => $primary_cta['url'],
															'label' => isset( $primary_cta['label'] ) ? $primary_cta['label'] : __( 'Get your report', 'google-site-kit' ),
														)
													);
													?>
												</td>
											</tr>
										</table>

										<?php /* Envelope illustration. */ ?>
										<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
											<tr>
												<td align="center" style="height: 163px;">
													<img src="<?php echo esc_url( $envelope_url ); ?>" alt="" width="209" height="163" style="display: block; max-width: 100%; height: auto;" />
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>

							<?php /* Footer text. */ ?>
							<table role="presentation" width="100%" style="margin-top: 24px;">
								<tr>
									<td style="text-align: left;">
										<p style="font-size: 12px; line-height: 16px; font-weight: 500; color: #6C726E; margin: 0;">
											<?php echo esc_html( $footer_copy ); ?>
										</p>
									</td>
								</tr>
							</table>
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
