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

class GoogleAnalyticsAdminV1alphaReportingDataAnnotation extends \Google\Model
{
  protected $annotationDateType = GoogleTypeDate::class;
  protected $annotationDateDataType = '';
  protected $annotationDateRangeType = GoogleAnalyticsAdminV1alphaReportingDataAnnotationDateRange::class;
  protected $annotationDateRangeDataType = '';
  /**
   * @var string
   */
  public $color;
  /**
   * @var string
   */
  public $description;
  /**
   * @var string
   */
  public $name;
  /**
   * @var bool
   */
  public $systemGenerated;
  /**
   * @var string
   */
  public $title;

  /**
   * @param GoogleTypeDate
   */
  public function setAnnotationDate(GoogleTypeDate $annotationDate)
  {
    $this->annotationDate = $annotationDate;
  }
  /**
   * @return GoogleTypeDate
   */
  public function getAnnotationDate()
  {
    return $this->annotationDate;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaReportingDataAnnotationDateRange
   */
  public function setAnnotationDateRange(GoogleAnalyticsAdminV1alphaReportingDataAnnotationDateRange $annotationDateRange)
  {
    $this->annotationDateRange = $annotationDateRange;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaReportingDataAnnotationDateRange
   */
  public function getAnnotationDateRange()
  {
    return $this->annotationDateRange;
  }
  /**
   * @param string
   */
  public function setColor($color)
  {
    $this->color = $color;
  }
  /**
   * @return string
   */
  public function getColor()
  {
    return $this->color;
  }
  /**
   * @param string
   */
  public function setDescription($description)
  {
    $this->description = $description;
  }
  /**
   * @return string
   */
  public function getDescription()
  {
    return $this->description;
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
  public function setSystemGenerated($systemGenerated)
  {
    $this->systemGenerated = $systemGenerated;
  }
  /**
   * @return bool
   */
  public function getSystemGenerated()
  {
    return $this->systemGenerated;
  }
  /**
   * @param string
   */
  public function setTitle($title)
  {
    $this->title = $title;
  }
  /**
   * @return string
   */
  public function getTitle()
  {
    return $this->title;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaReportingDataAnnotation::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaReportingDataAnnotation');
