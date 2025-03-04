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

namespace Google\Service\SearchConsole;

class InspectUrlIndexRequest extends \Google\Model
{
  /**
   * @var string
   */
  public $inspectionUrl;
  /**
   * @var string
   */
  public $languageCode;
  /**
   * @var string
   */
  public $siteUrl;

  /**
   * @param string
   */
  public function setInspectionUrl($inspectionUrl)
  {
    $this->inspectionUrl = $inspectionUrl;
  }
  /**
   * @return string
   */
  public function getInspectionUrl()
  {
    return $this->inspectionUrl;
  }
  /**
   * @param string
   */
  public function setLanguageCode($languageCode)
  {
    $this->languageCode = $languageCode;
  }
  /**
   * @return string
   */
  public function getLanguageCode()
  {
    return $this->languageCode;
  }
  /**
   * @param string
   */
  public function setSiteUrl($siteUrl)
  {
    $this->siteUrl = $siteUrl;
  }
  /**
   * @return string
   */
  public function getSiteUrl()
  {
    return $this->siteUrl;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(InspectUrlIndexRequest::class, 'Google_Service_SearchConsole_InspectUrlIndexRequest');
