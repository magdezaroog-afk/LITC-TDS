import React from 'react';
import { DynamicCustomField } from '../../pages/admin/tabs/DynamicFieldsTab';
import { InteractiveTicketCreatorForm } from './InteractiveTicketCreatorForm';

export interface TicketCreatorFormProps {
  customFields: DynamicCustomField[];
  allowedRouteIds?: string[];
  concurrencyPolicy?: 'ALLOW_MULTIPLE' | 'PREVENT_CONCURRENT';
  hasActiveTicketInRoute?: (routeId: string) => boolean | string;
  glassPanelStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

export const TicketCreatorForm: React.FC<TicketCreatorFormProps> = (props) => {
  return (
    <div style={{ width: '100%' }}>
      <InteractiveTicketCreatorForm {...props} />
    </div>
  );
};
