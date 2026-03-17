// ============================================================
// webparts/hRZiektebriefjes/HRZiektebriefjesWebPart.ts
//
// ============================================================
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { initializeIcons } from '@fluentui/react';

import { initializePnPjs } from '../../config/pnpjsConfig';
import { HrZiektebriefjesApp } from '../../components/HrZiektebriefjesApp';

export interface IHRZiektebriefjesWebPartProps {
  title: string;
}

export default class HRZiektebriefjesWebPart extends BaseClientSideWebPart<IHRZiektebriefjesWebPartProps> {

  public async onInit(): Promise<void> {
    await super.onInit();
    initializeIcons();
    initializePnPjs(this.context);
  }

  public render(): void {
    const element: React.ReactElement = React.createElement(HrZiektebriefjesApp);
    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [{
        header: { description: 'HR Ziektebriefjes instellingen' },
        groups: [{
          groupName: 'Algemeen',
          groupFields: [
            PropertyPaneTextField('title', { label: 'Titel', value: 'HR Ziektebriefjes' }),
          ],
        }],
      }],
    };
  }
}
