<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\GoogleAnalyticsAdmin;

class GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings extends \Google\Model
{
  /**
   * @var bool
   */
  public $fileDownloadsEnabled;
  /**
   * @var bool
   */
  public $formInteractionsEnabled;
  /**
   * @var string
   */
  public $name;
  /**
   * @var bool
   */
  public $outboundClicksEnabled;
  /**
   * @var bool
   */
  public $pageChangesEnabled;
  /**
   * @var bool
   */
  public $scrollsEnabled;
  /**
   * @var string
   */
  public $searchQueryParameter;
  /**
   * @var bool
   */
  public $siteSearchEnabled;
  /**
   * @var bool
   */
  public $streamEnabled;
  /**
   * @var string
   */
  public $uriQueryParameter;
  /**
   * @var bool
   */
  public $videoEngagementEnabled;

  /**
   * @param bool
   */
  public function setFileDownloadsEnabled($fileDownloadsEnabled)
  {
    $this->fileDownloadsEnabled = $fileDownloadsEnabled;
  }
  /**
   * @return bool
   */
  public function getFileDownloadsEnabled()
  {
    return $this->fileDownloadsEnabled;
  }
  /**
   * @param bool
   */
  public function setFormInteractionsEnabled($formInteractionsEnabled)
  {
    $this->formInteractionsEnabled = $formInteractionsEnabled;
  }
  /**
   * @return bool
   */
  public function getFormInteractionsEnabled()
  {
    return $this->formInteractionsEnabled;
  }
  /**
   * @param string
   */
  public function setName($name)
  {
    $this->name = $name;
  }
  /**
   * @return string
   */
  public function getName()
  {
    return $this->name;
  }
  /**
   * @param bool
   */
  public function setOutboundClicksEnabled($outboundClicksEnabled)
  {
    $this->outboundClicksEnabled = $outboundClicksEnabled;
  }
  /**
   * @return bool
   */
  public function getOutboundClicksEnabled()
  {
    return $this->outboundClicksEnabled;
  }
  /**
   * @param bool
   */
  public function setPageChangesEnabled($pageChangesEnabled)
  {
    $this->pageChangesEnabled = $pageChangesEnabled;
  }
  /**
   * @return bool
   */
  public function getPageChangesEnabled()
  {
    return $this->pageChangesEnabled;
  }
  /**
   * @param bool
   */
  public function setScrollsEnabled($scrollsEnabled)
  {
    $this->scrollsEnabled = $scrollsEnabled;
  }
  /**
   * @return bool
   */
  public function getScrollsEnabled()
  {
    return $this->scrollsEnabled;
  }
  /**
   * @param string
   */
  public function setSearchQueryParameter($searchQueryParameter)
  {
    $this->searchQueryParameter = $searchQueryParameter;
  }
  /**
   * @return string
   */
  public function getSearchQueryParameter()
  {
    return $this->searchQueryParameter;
  }
  /**
   * @param bool
   */
  public function setSiteSearchEnabled($siteSearchEnabled)
  {
    $this->siteSearchEnabled = $siteSearchEnabled;
  }
  /**
   * @return bool
   */
  public function getSiteSearchEnabled()
  {
    return $this->siteSearchEnabled;
  }
  /**
   * @param bool
   */
  public function setStreamEnabled($streamEnabled)
  {
    $this->streamEnabled = $streamEnabled;
  }
  /**
   * @return bool
   */
  public function getStreamEnabled()
  {
    return $this->streamEnabled;
  }
  /**
   * @param string
   */
  public function setUriQueryParameter($uriQueryParameter)
  {
    $this->uriQueryParameter = $uriQueryParameter;
  }
  /**
   * @return string
   */
  public function getUriQueryParameter()
  {
    return $this->uriQueryParameter;
  }
  /**
   * @param bool
   */
  public function setVideoEngagementEnabled($videoEngagementEnabled)
  {
    $this->videoEngagementEnabled = $videoEngagementEnabled;
  }
  /**
   * @return bool
   */
  public function getVideoEngagementEnabled()
  {
    return $this->videoEngagementEnabled;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings');
