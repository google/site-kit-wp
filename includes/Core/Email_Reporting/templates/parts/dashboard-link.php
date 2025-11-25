<?php
/**
 * Dashboard link reusable part.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var string $url   The dashboard URL.
 * @var string $label The link label.
 */

$label = isset( $label ) ? $label : __( 'Open dashboard', 'google-site-kit' );
?>
<a href="<?php echo esc_url( $url ); ?>" style="font-size:14px; line-height:20px; font-weight:500; text-decoration:none; display:inline-block; background:#3C7251; color:#ffffff; padding:10px 16px; border-radius:100px;" rel="noopener" target="_blank">
	<?php echo esc_html( $label ); ?>
</a>
