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

$label = $label ?? __( 'Open dashboard', 'google-site-kit' );
?>
<?php /* Outlook requires custom VML for rounded corners. */ ?>
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="<?php echo esc_url( $url ); ?>" style="mso-wrap-style:none; mso-fit-shape-to-text: true; height:36; width:134;" arcsize="50%" strokecolor="#3C7251" fillcolor="#3C7251">
<w:anchorlock/>
<center style="font-family:Arial,sans-serif; font-size:14px; font-weight:500; color:#ffffff; text-decoration:none; mso-line-height-rule:exactly;">
<?php echo esc_html( $label ); ?>
</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="<?php echo esc_url( $url ); ?>" style="font-size:14px; line-height:20px; font-weight:500; text-decoration:none; display:inline-block; background:#3C7251; color:#ffffff; padding:10px 16px; border-radius:100px; mso-hide:all;" rel="noopener" target="_blank">
	<?php echo esc_html( $label ); ?>
</a>
<!--<![endif]-->
