<?php
/**
 * Header section for the subscription-confirmation email template.
 *
 * A simplified header with just the Site Kit logo, matching
 * the invitation-email header style.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var callable $get_asset_url Function to generate asset URLs.
 */

$logo_url = $get_asset_url( 'site-kit-logo' );
?>
<table role="presentation" width="100%">
	<tr>
		<td style="padding: 24px 0 16px 0; text-align: center;" align="center">
			<img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr__( 'Site Kit by Google', 'google-site-kit' ); ?>" width="79" height="22" style="display: inline-block;" />
		</td>
	</tr>
</table>
