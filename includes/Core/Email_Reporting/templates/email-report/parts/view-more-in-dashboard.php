<?php
/**
 * View more in dashboard link part.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var string   $url           The dashboard URL.
 * @var string   $label         Optional link label.
 * @var callable $get_asset_url Function to get asset URLs.
 */

$label     = $label ?? __( 'View more in dashboard', 'google-site-kit' );
$arrow_url = $get_asset_url( 'icon-link-arrow.png' );
?>
<table role="presentation" width="100%">
	<tr>
		<td style="text-align:right; height: 16px;" height="16">
			<a href="<?php echo esc_url( $url ); ?>" style="font-size:12px; line-height:16px; font-weight:500; color:#108080; text-decoration:none;">
				<?php echo esc_html( $label ); ?>
				<img src="<?php echo esc_url( $arrow_url ); ?>" alt="" width="10" height="10" style="vertical-align:middle; margin-left:4px; margin-bottom: 2px;" />
			</a>
		</td>
	</tr>
</table>

