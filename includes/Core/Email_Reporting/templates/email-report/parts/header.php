<?php
/**
 * Header section for the email-report template.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var string   $site_domain   The site domain.
 * @var string   $date_label    The date range label.
 * @var callable $get_asset_url Function to generate asset URLs.
 */

$logo_url           = $get_asset_url( 'site-kit-logo.png' );
$shooting_stars_url = $get_asset_url( 'shooting-stars-graphic.png' );
?>
<table role="presentation" width="100%">
	<tr>
		<td style="padding-bottom:16px;">
			<table role="presentation" width="100%">
				<tr>
					<td style="vertical-align:top;" width="79">
						<img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr__( 'Site Kit by Google', 'google-site-kit' ); ?>" width="79" height="22" style="display:block; margin-top: 12px;" />
					</td>
					<?php /* Extra centering for Outlook. */ ?>
					<td style="vertical-align:top; text-align:center;" align="center">
						<center>
							<img src="<?php echo esc_url( $shooting_stars_url ); ?>" alt="" width="107" height="56" style="display:block; margin: 24px auto 0 auto;" align="center" />
						</center>
					</td>
					<td width="79">&nbsp;</td>
				</tr>
				<tr>
					<td style="text-align:center; vertical-align:middle; font-size:13px; color: #161B18;" colspan="3">
						<h1 style="font-weight: 400; font-size: 22px; line-height: 28px; margin: 0"><?php echo esc_html__( 'Your performance at a glance', 'google-site-kit' ); ?></h1>
						<div style="font-weight: 500; size: 14px; line-height: 20px; margin: 0; margin-top: 2px;"><?php echo esc_html( $date_label ); ?></div>
						<?php /* This domain is linked so that we can enforce our styles within email clients which otherwise detect it as a link and add their own styles. */ ?>
						<div style="font-weight: 400; font-size: 14px; line-height: 20px; margin: 0; margin-top: 4px;"><a href="<?php echo esc_url( '//' . $site_domain ); ?>" style="color: #6C726E; text-decoration: none;"><?php echo esc_html( $site_domain ); ?></a></div>
					</td>
				</tr>
			</table>
		</td>
	</tr>
</table>
