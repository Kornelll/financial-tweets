import { Component, OnInit, Input } from '@angular/core';
import { CommonScripts } from '@/scripts';

@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.scss']
})
export class TagComponent implements OnInit {

  _config: TagConfig;
  @Input() set config(config: TagConfig) {
    this._config = config;
    if (config && !config.bg) {
      config.bg = CommonScripts.getRandomColor();
      //Overriding color for better contract text color
      config.color = CommonScripts.contrastColor(config.bg);
    }
    if (!config.color) {
      config.color = CommonScripts.contrastColor(config.bg);
    }
  }
  get config() {
    return this._config;
  }

  constructor() { }

  ngOnInit() {
  }

}


export interface TagConfig {
  title: string,
  bg?: string,
  color?: string,
  tooltip?: string,
  tooltipPosition?: ''|'above'|'below'|'left'|'right'
}